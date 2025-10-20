"""
Pinecone Service for Vector Storage
Handles vector storage and retrieval using Pinecone
"""
import logging
from typing import List, Dict, Optional
from pinecone import Pinecone, ServerlessSpec
from app.config import settings

logger = logging.getLogger(__name__)


class PineconeService:
    """Service for Pinecone vector operations"""
    
    def __init__(self):
        """Initialize Pinecone service"""
        if not settings.PINECONE_API_KEY:
            raise ValueError("PINECONE_API_KEY is not set in environment variables")
        
        # Initialize Pinecone client
        self.pc = Pinecone(api_key=settings.PINECONE_API_KEY)
        self.index_name = settings.PINECONE_INDEX_NAME
        self.index = None
        
        logger.info(f"PineconeService initialized for index: {self.index_name}")
    
    async def initialize(self):
        """Initialize or connect to Pinecone index"""
        try:
            # Check if index exists
            existing_indexes = self.pc.list_indexes()
            index_names = [index.name for index in existing_indexes]
            
            if self.index_name not in index_names:
                # Create new index
                logger.info(f"Creating new Pinecone index: {self.index_name}")
                self.pc.create_index(
                    name=self.index_name,
                    dimension=settings.VECTOR_DIMENSION,
                    metric='cosine',
                    spec=ServerlessSpec(
                        cloud='aws',
                        region=settings.PINECONE_ENVIRONMENT
                    )
                )
                logger.info(f"✅ Created Pinecone index: {self.index_name}")
            else:
                logger.info(f"✅ Connected to existing Pinecone index: {self.index_name}")
            
            # Connect to index
            self.index = self.pc.Index(self.index_name)
            
            # Get index stats
            stats = self.index.describe_index_stats()
            logger.info(f"Index stats: {stats}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error initializing Pinecone: {str(e)}")
            raise
    
    async def upsert_vectors(self, vectors: List[Dict]) -> Dict:
        """
        Upsert vectors to Pinecone
        
        Args:
            vectors: List of dicts with id, values, and metadata
                Example: [{'id': 'doc1_chunk1', 'values': [0.1, 0.2, ...], 'metadata': {...}}]
        
        Returns:
            Upsert response
        """
        try:
            if not self.index:
                raise ValueError("Index not initialized. Call initialize() first.")
            
            # Upsert vectors
            response = self.index.upsert(vectors=vectors)
            
            logger.info(f"Upserted {len(vectors)} vectors to Pinecone")
            return response
            
        except Exception as e:
            logger.error(f"Error upserting vectors: {str(e)}")
            raise
    
    async def query_vectors(
        self, 
        query_vector: List[float], 
        top_k: int = 5,
        filter_dict: Optional[Dict] = None
    ) -> List[Dict]:
        """
        Query similar vectors from Pinecone
        
        Args:
            query_vector: Query embedding vector
            top_k: Number of results to return
            filter_dict: Optional metadata filter
            
        Returns:
            List of matching results with metadata
        """
        try:
            if not self.index:
                raise ValueError("Index not initialized. Call initialize() first.")
            
            # Query index
            results = self.index.query(
                vector=query_vector,
                top_k=top_k,
                include_metadata=True,
                filter=filter_dict
            )
            
            # Format results
            matches = []
            for match in results.matches:
                matches.append({
                    'id': match.id,
                    'score': match.score,
                    'metadata': match.metadata
                })
            
            logger.info(f"Found {len(matches)} matching vectors")
            return matches
            
        except Exception as e:
            logger.error(f"Error querying vectors: {str(e)}")
            raise
    
    async def delete_vectors(self, ids: List[str]) -> Dict:
        """
        Delete vectors by IDs
        
        Args:
            ids: List of vector IDs to delete
            
        Returns:
            Delete response
        """
        try:
            if not self.index:
                raise ValueError("Index not initialized. Call initialize() first.")
            
            response = self.index.delete(ids=ids)
            
            logger.info(f"Deleted {len(ids)} vectors from Pinecone")
            return response
            
        except Exception as e:
            logger.error(f"Error deleting vectors: {str(e)}")
            raise
    
    async def delete_by_filter(self, filter_dict: Dict) -> Dict:
        """
        Delete vectors by metadata filter
        
        Args:
            filter_dict: Metadata filter to match vectors for deletion
            
        Returns:
            Delete response
        """
        try:
            if not self.index:
                raise ValueError("Index not initialized. Call initialize() first.")
            
            response = self.index.delete(filter=filter_dict)
            
            logger.info(f"Deleted vectors matching filter: {filter_dict}")
            return response
            
        except Exception as e:
            logger.error(f"Error deleting by filter: {str(e)}")
            raise
    
    async def get_stats(self) -> Dict:
        """
        Get index statistics
        
        Returns:
            Index stats
        """
        try:
            if not self.index:
                raise ValueError("Index not initialized. Call initialize() first.")
            
            stats = self.index.describe_index_stats()
            return stats
            
        except Exception as e:
            logger.error(f"Error getting stats: {str(e)}")
            raise
    
    def is_initialized(self) -> bool:
        """Check if service is initialized"""
        return self.index is not None
