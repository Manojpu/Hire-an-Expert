"""
Gemini Service for RAG System
Handles embeddings generation and LLM answer generation using Google Gemini
"""
import logging
from typing import List, Dict
import google.generativeai as genai
from app.config import settings

logger = logging.getLogger(__name__)


class GeminiService:
    """Service for Gemini AI operations"""
    
    def __init__(self):
        """Initialize Gemini service with API key authentication"""
        
        # Configure Gemini API with API key
        if not settings.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY must be configured in .env file")
        
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        logger.info("✅ GeminiService initialized with API KEY authentication")
        
        logger.info(f"✅ Embedding model: {settings.GEMINI_EMBEDDING_MODEL}")
        logger.info(f"✅ LLM model: {settings.GEMINI_MODEL}")
    
    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding vector for text using Gemini embedding-001
        
        Args:
            text: Text to embed
            
        Returns:
            Embedding vector (768 dimensions)
        """
        try:
            result = genai.embed_content(
                model=settings.GEMINI_EMBEDDING_MODEL,
                content=text,
                task_type="retrieval_document"
            )
            
            embedding = result['embedding']
            logger.debug(f"Generated embedding with {len(embedding)} dimensions")
            return embedding
            
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            raise ValueError(f"Failed to generate embedding: {str(e)}")
    
    def generate_query_embedding(self, query: str) -> List[float]:
        """
        Generate embedding for search query
        
        Args:
            query: Search query text
            
        Returns:
            Query embedding vector
        """
        try:
            result = genai.embed_content(
                model=settings.GEMINI_EMBEDDING_MODEL,
                content=query,
                task_type="retrieval_query"
            )
            
            embedding = result['embedding']
            logger.debug(f"Generated query embedding with {len(embedding)} dimensions")
            return embedding
            
        except Exception as e:
            logger.error(f"Error generating query embedding: {str(e)}")
            raise ValueError(f"Failed to generate query embedding: {str(e)}")
    
    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts
        
        Args:
            texts: List of texts to embed
            
        Returns:
            List of embedding vectors
        """
        embeddings = []
        
        for i, text in enumerate(texts):
            try:
                embedding = self.generate_embedding(text)
                embeddings.append(embedding)
                
                if (i + 1) % 10 == 0:
                    logger.info(f"Generated {i + 1}/{len(texts)} embeddings")
                    
            except Exception as e:
                logger.error(f"Error embedding text {i}: {str(e)}")
                # Append None for failed embeddings
                embeddings.append(None)
        
        logger.info(f"Generated {len([e for e in embeddings if e is not None])}/{len(texts)} embeddings successfully")
        return embeddings
    
    def generate_answer(self, query: str, context_chunks: List[str]) -> Dict[str, any]:
        """
        Generate answer using Gemini LLM with retrieved context
        
        Args:
            query: User's question
            context_chunks: Retrieved relevant text chunks
            
        Returns:
            Dict with answer and metadata
        """
        try:
            # Build context from chunks
            context = "\n\n".join([f"[Context {i+1}]\n{chunk}" for i, chunk in enumerate(context_chunks)])
            
            # Create prompt
            prompt = f"""You are a helpful AI assistant. Answer the user's question based on the provided context.
If the context doesn't contain enough information to answer the question, say so clearly.

Context:
{context}

User Question: {query}

Answer:"""
            
            # Generate response using GenerativeModel
            model = genai.GenerativeModel(settings.GEMINI_MODEL)
            response = model.generate_content(prompt)
            answer = response.text
            
            logger.info(f"Generated answer for query: {query[:50]}...")
            
            return {
                'answer': answer,
                'context_used': len(context_chunks),
                'model': settings.GEMINI_MODEL
            }
            
        except Exception as e:
            logger.error(f"Error generating answer: {str(e)}")
            raise ValueError(f"Failed to generate answer: {str(e)}")
    
    def check_connection(self) -> bool:
        """
        Check if Gemini API is accessible
        
        Returns:
            True if connected, False otherwise
        """
        try:
            # Try to generate a simple embedding
            test_result = genai.embed_content(
                model=settings.GEMINI_EMBEDDING_MODEL,
                content="test",
                task_type="retrieval_document"
            )
            return len(test_result['embedding']) == settings.VECTOR_DIMENSION
        except Exception as e:
            logger.error(f"Gemini connection check failed: {str(e)}")
            return False
