"""
Lightweight RAG Engine
Coordinates document processing, embedding, storage, and query answering
"""
import logging
from typing import List, Dict, Optional
from app.services.document_processor import DocumentProcessor
from app.services.gemini_service import GeminiService
from app.services.pinecone_service import PineconeService
from app.services.mongodb_service import MongoDBService
from app.config import settings

logger = logging.getLogger(__name__)


class RAGEngine:
    """Lightweight RAG Engine using Pinecone and Gemini"""
    
    def __init__(
        self,
        doc_processor: DocumentProcessor,
        gemini_service: GeminiService,
        pinecone_service: PineconeService,
        mongodb_service: MongoDBService
    ):
        """
        Initialize RAG Engine
        
        Args:
            doc_processor: Document processor instance
            gemini_service: Gemini service instance
            pinecone_service: Pinecone service instance
            mongodb_service: MongoDB service instance
        """
        self.doc_processor = doc_processor
        self.gemini = gemini_service
        self.pinecone = pinecone_service
        self.mongodb = mongodb_service
        
        logger.info("✅ RAG Engine initialized")
    
    async def process_and_store_document(
        self, 
        filename: str, 
        file_content: bytes,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Process document: chunk → embed → store in Pinecone and MongoDB
        
        Args:
            filename: Original filename
            file_content: File content as bytes
            metadata: Optional additional metadata
            
        Returns:
            Processing results
        """
        try:
            logger.info(f"Processing document: {filename}")
            
            # Step 1: Process document and create chunks
            processed = self.doc_processor.process_document(file_content, filename)
            chunks = processed['chunks']
            chunk_count = processed['chunk_count']
            
            logger.info(f"Created {chunk_count} chunks from {filename}")
            
            # Step 2: Store original file in MongoDB
            file_type = filename.lower().split('.')[-1]
            doc_id = await self.mongodb.store_document(
                filename=filename,
                file_content=file_content,
                file_type=file_type,
                chunk_count=chunk_count,
                metadata=metadata
            )
            
            logger.info(f"Stored document in MongoDB with ID: {doc_id}")
            
            # Step 3: Generate embeddings for all chunks
            logger.info("Generating embeddings...")
            embeddings = self.gemini.generate_embeddings_batch(chunks)
            
            # Filter out failed embeddings
            valid_embeddings = [
                (i, emb, chunk) 
                for i, (emb, chunk) in enumerate(zip(embeddings, chunks)) 
                if emb is not None
            ]
            
            logger.info(f"Generated {len(valid_embeddings)} valid embeddings")
            
            # Step 4: Prepare vectors for Pinecone
            vectors = []
            for idx, embedding, chunk in valid_embeddings:
                vector_id = f"{doc_id}_chunk_{idx}"
                vectors.append({
                    'id': vector_id,
                    'values': embedding,
                    'metadata': {
                        'doc_id': doc_id,
                        'filename': filename,
                        'chunk_index': idx,
                        'text': chunk,
                        'file_type': file_type
                    }
                })
            
            # Step 5: Upsert vectors to Pinecone
            logger.info("Storing vectors in Pinecone...")
            await self.pinecone.upsert_vectors(vectors)
            
            logger.info(f"✅ Successfully processed and stored document: {filename}")
            
            return {
                'success': True,
                'doc_id': doc_id,
                'filename': filename,
                'chunk_count': chunk_count,
                'embeddings_created': len(valid_embeddings),
                'file_type': file_type
            }
            
        except Exception as e:
            logger.error(f"Error processing document: {str(e)}")
            raise ValueError(f"Failed to process document: {str(e)}")
    
    async def query(self, query_text: str, top_k: int = None) -> Dict:
        """
        Query RAG system: embed query → search Pinecone → generate answer
        
        Args:
            query_text: User's question
            top_k: Number of chunks to retrieve (default from settings)
            
        Returns:
            Answer with sources
        """
        try:
            logger.info(f"Processing query: {query_text[:50]}...")
            
            if top_k is None:
                top_k = settings.TOP_K_RESULTS
            
            # Check for simple greetings/small talk
            greetings = ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening']
            if query_text.lower().strip() in greetings:
                return {
                    'success': True,
                    'answer': "Hello! I'm your AI assistant powered by RAG (Retrieval-Augmented Generation). I can help answer questions based on the documents in my knowledge base. How can I assist you today?",
                    'sources': [],
                    'context_used': 0
                }
            
            # Step 1: Generate query embedding
            query_embedding = self.gemini.generate_query_embedding(query_text)
            logger.info("Generated query embedding")
            
            # Step 2: Search Pinecone for similar chunks
            matches = await self.pinecone.query_vectors(query_embedding, top_k=top_k)
            
            if not matches:
                return {
                    'success': True,
                    'answer': "I couldn't find any relevant information in my knowledge base to answer your question. Please make sure documents have been uploaded to the system, or try asking something else.",
                    'sources': [],
                    'context_used': 0
                }
            
            logger.info(f"Found {len(matches)} relevant chunks")
            
            # Step 3: Extract text chunks from matches
            context_chunks = [match['metadata']['text'] for match in matches]
            
            # Step 4: Generate answer using Gemini
            answer_result = self.gemini.generate_answer(query_text, context_chunks)
            
            # Step 5: Prepare sources
            sources = []
            for match in matches:
                sources.append({
                    'filename': match['metadata']['filename'],
                    'chunk_index': match['metadata']['chunk_index'],
                    'score': match['score'],
                    'text_preview': match['metadata']['text'][:200] + '...'
                })
            
            logger.info(f"✅ Generated answer for query")
            
            return {
                'success': True,
                'answer': answer_result['answer'],
                'sources': sources,
                'context_used': len(context_chunks),
                'model': answer_result['model']
            }
            
        except Exception as e:
            logger.error(f"Error processing query: {str(e)}")
            raise ValueError(f"Failed to process query: {str(e)}")
    
    async def delete_document(self, doc_id: str) -> bool:
        """
        Delete document from both MongoDB and Pinecone
        
        Args:
            doc_id: Document ID
            
        Returns:
            True if deleted successfully
        """
        try:
            logger.info(f"Deleting document: {doc_id}")
            
            # Delete from Pinecone (by filter)
            await self.pinecone.delete_by_filter({'doc_id': doc_id})
            logger.info(f"Deleted vectors from Pinecone for doc: {doc_id}")
            
            # Delete from MongoDB
            deleted = await self.mongodb.delete_document(doc_id)
            
            if deleted:
                logger.info(f"✅ Successfully deleted document: {doc_id}")
                return True
            else:
                logger.warning(f"Document not found in MongoDB: {doc_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error deleting document: {str(e)}")
            raise
    
    async def list_documents(self, limit: int = 50, skip: int = 0) -> List[Dict]:
        """
        List all stored documents
        
        Args:
            limit: Maximum number of documents
            skip: Number of documents to skip
            
        Returns:
            List of document metadata
        """
        try:
            documents = await self.mongodb.list_documents(limit=limit, skip=skip)
            return documents
            
        except Exception as e:
            logger.error(f"Error listing documents: {str(e)}")
            return []
    
    async def get_document_info(self, doc_id: str) -> Optional[Dict]:
        """
        Get document information
        
        Args:
            doc_id: Document ID
            
        Returns:
            Document metadata or None
        """
        try:
            doc = await self.mongodb.get_document(doc_id)
            return doc
            
        except Exception as e:
            logger.error(f"Error getting document info: {str(e)}")
            return None
    
    async def get_document_file(self, doc_id: str) -> Optional[bytes]:
        """
        Get original document file content
        
        Args:
            doc_id: Document ID
            
        Returns:
            File content as bytes or None
        """
        try:
            # Get document metadata
            doc = await self.mongodb.get_document(doc_id)
            
            if not doc:
                return None
            
            # Get file content
            file_id = doc.get('file_id')
            if not file_id:
                return None
            
            content = await self.mongodb.get_document_file(file_id)
            return content
            
        except Exception as e:
            logger.error(f"Error getting document file: {str(e)}")
            return None
