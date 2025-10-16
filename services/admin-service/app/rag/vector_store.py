"""
FAISS Vector Store with MongoDB GridFS Persistence
Handles vector embeddings and similarity search
Stores index in MongoDB GridFS for Docker/Cloud compatibility
"""
import os
import pickle
import numpy as np
import faiss
import logging
import io
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from sentence_transformers import SentenceTransformer
from app.config import settings

logger = logging.getLogger(__name__)

class FAISSVectorStore:
    """FAISS vector store for similarity search with MongoDB persistence"""
    
    def __init__(self, db=None):
        self.index: Optional[faiss.Index] = None
        self.embedding_model = None
        self.metadata_store: Dict[int, Dict] = {}
        self.index_path = settings.FAISS_INDEX_PATH
        self.metadata_path = f"{self.index_path}/metadata.pkl"
        self.initialized = False
        self.db = db  # MongoDB instance for GridFS storage
        
    async def initialize(self):
        """Initialize the vector store with MongoDB persistence"""
        try:
            # Create data directory for local cache
            os.makedirs(self.index_path, exist_ok=True)
            
            # Load embedding model
            logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
            self.embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
            logger.info("✅ Embedding model loaded")
            
            # Try to load from local cache first (fastest)
            local_index_file = f"{self.index_path}/faiss.index"
            loaded_from_local = False
            
            if os.path.exists(local_index_file):
                try:
                    logger.info("Loading FAISS index from local cache...")
                    self.index = faiss.read_index(local_index_file)
                    
                    # Load metadata
                    if os.path.exists(self.metadata_path):
                        with open(self.metadata_path, 'rb') as f:
                            self.metadata_store = pickle.load(f)
                    
                    loaded_from_local = True
                    logger.info(f"✅ Loaded from local cache: {self.index.ntotal} vectors")
                except Exception as e:
                    logger.warning(f"Failed to load from local cache: {str(e)}")
            
            # If not in local cache, try MongoDB GridFS
            if not loaded_from_local and self.db:
                try:
                    logger.info("Loading FAISS index from MongoDB GridFS...")
                    if await self._load_from_mongodb():
                        # Save to local cache for next time
                        self._save_to_local()
                        logger.info(f"✅ Loaded from MongoDB: {self.index.ntotal} vectors")
                    else:
                        # Create new index
                        logger.info("No existing index found, creating new...")
                        self.index = faiss.IndexFlatL2(settings.VECTOR_DIMENSION)
                        logger.info("✅ Created new FAISS index")
                except Exception as e:
                    logger.warning(f"Failed to load from MongoDB: {str(e)}")
                    self.index = faiss.IndexFlatL2(settings.VECTOR_DIMENSION)
            elif not loaded_from_local:
                # No local cache and no MongoDB connection
                logger.info("Creating new FAISS index...")
                self.index = faiss.IndexFlatL2(settings.VECTOR_DIMENSION)
                logger.info("✅ Created new FAISS index")
            
            self.initialized = True
            
        except Exception as e:
            logger.error(f"❌ Error initializing vector store: {str(e)}")
            raise
    
    def is_initialized(self) -> bool:
        """Check if vector store is initialized"""
        return self.initialized
    
    def generate_embeddings(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings for texts"""
        try:
            embeddings = self.embedding_model.encode(texts, show_progress_bar=False)
            return embeddings
        except Exception as e:
            logger.error(f"Error generating embeddings: {str(e)}")
            raise
    
    def add_documents(self, texts: List[str], metadatas: List[Dict[str, Any]]) -> List[int]:
        """Add documents to the vector store"""
        try:
            if not texts:
                return []
            
            # Generate embeddings
            embeddings = self.generate_embeddings(texts)
            
            # Get starting index
            start_idx = self.index.ntotal
            
            # Add to FAISS index
            self.index.add(embeddings.astype('float32'))
            
            # Store metadata
            indices = []
            for i, metadata in enumerate(metadatas):
                idx = start_idx + i
                self.metadata_store[idx] = {
                    "text": texts[i],
                    **metadata
                }
                indices.append(idx)
            
            # Save index and metadata
            self._save()
            
            logger.info(f"✅ Added {len(texts)} documents to vector store")
            return indices
            
        except Exception as e:
            logger.error(f"Error adding documents: {str(e)}")
            raise
    
    async def _load_from_mongodb(self) -> bool:
        """Load FAISS index and metadata from MongoDB GridFS"""
        try:
            if not self.db or not self.db.fs:
                logger.warning("MongoDB GridFS not available")
                return False
            
            # Check if files exist in GridFS (use db.db instead of db.fs for queries)
            index_file = await self.db.db.fs.files.find_one({"filename": "faiss_index.bin"})
            metadata_file = await self.db.db.fs.files.find_one({"filename": "faiss_metadata.pkl"})
            
            if not index_file or not metadata_file:
                logger.info("No FAISS index found in MongoDB GridFS")
                return False
            
            # Download FAISS index
            logger.info("Downloading FAISS index from GridFS...")
            index_stream = await self.db.fs.open_download_stream(index_file['_id'])
            index_bytes = await index_stream.read()
            
            # Deserialize FAISS index
            self.index = faiss.deserialize_index(np.frombuffer(index_bytes, dtype=np.uint8))
            
            # Download metadata
            logger.info("Downloading metadata from GridFS...")
            meta_stream = await self.db.fs.open_download_stream(metadata_file['_id'])
            meta_bytes = await meta_stream.read()
            self.metadata_store = pickle.loads(meta_bytes)
            
            logger.info(f"✅ Loaded from MongoDB: {self.index.ntotal} vectors, {len(self.metadata_store)} metadata entries")
            return True
            
        except Exception as e:
            logger.error(f"Error loading from MongoDB: {str(e)}")
            return False
    
    async def _save_to_mongodb(self):
        """Save FAISS index and metadata to MongoDB GridFS"""
        try:
            if not self.db or not self.db.fs:
                logger.warning("MongoDB GridFS not available, skipping cloud save")
                return
            
            # Serialize FAISS index
            index_bytes = faiss.serialize_index(self.index)
            
            # Delete old files if they exist (use db.db.fs.files for queries)
            old_index = await self.db.db.fs.files.find_one({"filename": "faiss_index.bin"})
            if old_index:
                await self.db.fs.delete(old_index['_id'])
            
            old_metadata = await self.db.db.fs.files.find_one({"filename": "faiss_metadata.pkl"})
            if old_metadata:
                await self.db.fs.delete(old_metadata['_id'])
            
            # Upload new FAISS index
            logger.info("Uploading FAISS index to MongoDB GridFS...")
            await self.db.fs.upload_from_stream(
                "faiss_index.bin",
                io.BytesIO(index_bytes.tobytes()),
                metadata={
                    "type": "faiss_index",
                    "vector_count": self.index.ntotal,
                    "dimension": settings.VECTOR_DIMENSION,
                    "updated_at": datetime.utcnow()
                }
            )
            
            # Upload metadata
            logger.info("Uploading metadata to MongoDB GridFS...")
            metadata_bytes = pickle.dumps(self.metadata_store)
            await self.db.fs.upload_from_stream(
                "faiss_metadata.pkl",
                io.BytesIO(metadata_bytes),
                metadata={
                    "type": "faiss_metadata",
                    "entry_count": len(self.metadata_store),
                    "updated_at": datetime.utcnow()
                }
            )
            
            logger.info(f"✅ Saved to MongoDB GridFS: {self.index.ntotal} vectors")
            
        except Exception as e:
            logger.error(f"Error saving to MongoDB: {str(e)}")
    
    def _save_to_local(self):
        """Save index and metadata to local disk (cache)"""
        try:
            # Save FAISS index
            index_file = f"{self.index_path}/faiss.index"
            faiss.write_index(self.index, index_file)
            
            # Save metadata
            with open(self.metadata_path, 'wb') as f:
                pickle.dump(self.metadata_store, f)
            
            logger.debug("Vector store saved to local cache")
            
        except Exception as e:
            logger.error(f"Error saving to local cache: {str(e)}")
    
    def search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """Search for similar documents"""
        try:
            if self.index.ntotal == 0:
                logger.warning("Vector store is empty")
                return []
            
            # Generate query embedding
            query_embedding = self.generate_embeddings([query])
            
            # Perform search
            k = min(k, self.index.ntotal)
            distances, indices = self.index.search(query_embedding.astype('float32'), k)
            
            # Prepare results
            results = []
            for i, idx in enumerate(indices[0]):
                if idx in self.metadata_store:
                    result = {
                        "index": int(idx),
                        "score": float(distances[0][i]),
                        "similarity": float(1 / (1 + distances[0][i])),  # Convert distance to similarity
                        **self.metadata_store[idx]
                    }
                    results.append(result)
            
            logger.info(f"Found {len(results)} results for query")
            return results
            
        except Exception as e:
            logger.error(f"Error searching: {str(e)}")
            return []
    
    def delete_by_document_id(self, document_id: str) -> int:
        """Delete all vectors associated with a document"""
        try:
            # Find indices to delete
            indices_to_delete = [
                idx for idx, meta in self.metadata_store.items()
                if meta.get("document_id") == document_id
            ]
            
            if not indices_to_delete:
                return 0
            
            # Remove from metadata
            for idx in indices_to_delete:
                del self.metadata_store[idx]
            
            # FAISS doesn't support deletion, so we need to rebuild the index
            # For now, we'll just remove metadata and mark as deleted
            # In production, you might want to rebuild periodically
            
            logger.info(f"Deleted {len(indices_to_delete)} vectors for document {document_id}")
            self._save()
            
            return len(indices_to_delete)
            
        except Exception as e:
            logger.error(f"Error deleting vectors: {str(e)}")
            return 0
    
    def get_stats(self) -> Dict[str, Any]:
        """Get vector store statistics"""
        return {
            "total_vectors": self.index.ntotal if self.index else 0,
            "vector_dimension": settings.VECTOR_DIMENSION,
            "embedding_model": settings.EMBEDDING_MODEL,
            "index_type": "FAISS IndexFlatL2",
            "metadata_count": len(self.metadata_store)
        }
    
    def _save(self):
        """Save index and metadata to both local cache and MongoDB"""
        try:
            # Always save to local cache (fast)
            self._save_to_local()
            
            # Also save to MongoDB if available (persistent, cloud-ready)
            if self.db:
                import asyncio
                # Run async save in sync context
                try:
                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                        # If we're already in an async context, schedule the task
                        asyncio.create_task(self._save_to_mongodb())
                    else:
                        # Run it synchronously
                        loop.run_until_complete(self._save_to_mongodb())
                except RuntimeError:
                    # Create new event loop if needed
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    loop.run_until_complete(self._save_to_mongodb())
            
        except Exception as e:
            logger.error(f"Error in _save: {str(e)}")
    
    def clear(self):
        """Clear all vectors and metadata"""
        try:
            self.index = faiss.IndexFlatL2(settings.VECTOR_DIMENSION)
            self.metadata_store = {}
            self._save()
            logger.info("✅ Vector store cleared")
        except Exception as e:
            logger.error(f"Error clearing vector store: {str(e)}")
