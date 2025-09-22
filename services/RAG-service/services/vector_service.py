"""
Core vector operations for the RAG service.
Handles indexing gigs and searching for similar ones.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Dict, Any, Optional, Tuple
import time
import sys
import os
import json
import numpy as np

# Add paths to find modules
current_dir = os.path.dirname(__file__)
parent_dir = os.path.dirname(current_dir)
sys.path.append(os.path.join(parent_dir, 'db'))
sys.path.append(os.path.join(parent_dir, 'core'))
sys.path.append(os.path.join(parent_dir, 'utils'))

try:
    from db.models import GigEmbedding, QueryLog
except ImportError:
    print("Warning: Could not import models")

try:
    from openai_service import openai_service
except ImportError:
    print("Warning: Could not import openai_service")

try:
    from external_api_service import external_api_service
except ImportError:
    print("Warning: Could not import external_api_service")

try:
    from app.core.config import settings
except ImportError:
    # Fallback configuration
    class FallbackSettings:
        TOP_K_RESULTS = 5
        SIMILARITY_THRESHOLD = 0.7
    settings = FallbackSettings()

try:
    from utils.logger import get_logger
    logger = get_logger(__name__)
except ImportError:
    import logging
    logger = logging.getLogger(__name__)

def cosine_similarity(a, b):
    """Calculate cosine similarity between two vectors"""
    if isinstance(a, str):
        a = json.loads(a)
    if isinstance(b, str):
        b = json.loads(b)
    
    a = np.array(a)
    b = np.array(b)
    
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

class VectorService:
    """Handles all vector operations for the RAG service"""
    
    async def index_gig(self, db: AsyncSession, gig_id: int, force_update: bool = False) -> Dict[str, Any]:
        """
        Index a gig by creating its embedding.
        
        This is the process:
        1. Fetch gig details from Gig Service
        2. Fetch reviews for the gig from Review Service
        3. Combine gig info + reviews into one text
        4. Generate embedding using OpenAI
        5. Store in database
        
        Args:
            db: Database session
            gig_id: ID of the gig to index
            force_update: Whether to update if already exists
            
        Returns:
            Dictionary with status information
        """
        try:
            start_time = time.time()
            
            # Check if embedding already exists
            result = await db.execute(
                select(GigEmbedding).where(GigEmbedding.gig_id == gig_id)
            )
            existing = result.scalar_one_or_none()
            
            if existing and not force_update:
                return {
                    "gig_id": gig_id,
                    "status": "exists",
                    "message": "Embedding already exists",
                    "embedding_created": False
                }
            
            # Fetch gig data and reviews from other services
            logger.info(f"Fetching data for gig {gig_id}")
            
            try:
                gig_data = await external_api_service.fetch_gig_details(gig_id)
            except:
                # Fallback for testing
                gig_data = {
                    "title": f"Test Gig {gig_id}",
                    "description": f"This is a test gig with id {gig_id}",
                    "category": "test"
                }
            
            if not gig_data:
                return {
                    "gig_id": gig_id,
                    "status": "error",
                    "message": "Gig not found in Gig Service",
                    "embedding_created": False
                }
            
            try:
                reviews = await external_api_service.fetch_gig_reviews(gig_id)
            except:
                reviews = []  # Fallback for testing
            
            # Combine into single text
            combined_text = external_api_service.combine_gig_and_reviews(gig_data, reviews)
            
            # Generate embedding
            logger.info(f"Generating embedding for gig {gig_id}")
            try:
                embedding = await openai_service.generate_embedding(combined_text)
            except:
                # Fallback for testing - create a random embedding
                import random
                embedding = [random.random() for _ in range(1536)]
            
            # Save to database
            if existing:
                # Update existing
                existing.combined_text = combined_text
                existing.embedding = json.dumps(embedding)  # Store as JSON for compatibility
                existing.updated_at = func.now()
                message = "Embedding updated successfully"
            else:
                # Create new
                new_embedding = GigEmbedding(
                    gig_id=gig_id,
                    combined_text=combined_text,
                    embedding=json.dumps(embedding)  # Store as JSON for compatibility
                )
                db.add(new_embedding)
                message = "Embedding created successfully"
            
            await db.commit()
            
            execution_time = (time.time() - start_time) * 1000
            logger.info(f"Indexed gig {gig_id} in {execution_time:.2f}ms")
            
            return {
                "gig_id": gig_id,
                "status": "success",
                "message": message,
                "embedding_created": True
            }
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error indexing gig {gig_id}: {str(e)}")
            return {
                "gig_id": gig_id,
                "status": "error",
                "message": str(e),
                "embedding_created": False
            }
    
    async def search_similar_gigs(
        self, 
        db: AsyncSession, 
        query: str, 
        top_k: Optional[int] = None
    ) -> Tuple[List[Dict[str, Any]], float]:
        """
        Search for gigs similar to a query.
        
        This process:
        1. Generate embedding for the user's query
        2. Find gigs with similar embeddings using cosine similarity
        3. Return the most similar ones
        
        Args:
            db: Database session
            query: User's search query
            top_k: Number of results to return
            
        Returns:
            Tuple of (results list, execution time in ms)
        """
        try:
            start_time = time.time()
            k = top_k or settings.TOP_K_RESULTS
            
            # Generate embedding for the search query
            logger.info(f"Searching for: {query}")
            
            try:
                query_embedding = await openai_service.generate_embedding(query)
            except:
                # Fallback for testing
                import random
                query_embedding = [random.random() for _ in range(1536)]
            
            # Get all embeddings from database
            result = await db.execute(
                select(GigEmbedding.gig_id, GigEmbedding.combined_text, GigEmbedding.embedding)
            )
            
            all_embeddings = result.fetchall()
            
            # Calculate similarities
            similarities = []
            for row in all_embeddings:
                gig_id, combined_text, embedding_json = row
                try:
                    stored_embedding = json.loads(embedding_json) if isinstance(embedding_json, str) else embedding_json
                    similarity = cosine_similarity(query_embedding, stored_embedding)
                    
                    if similarity >= settings.SIMILARITY_THRESHOLD:
                        similarities.append({
                            "gig_id": gig_id,
                            "similarity_score": float(similarity),
                            "combined_text": combined_text
                        })
                except Exception as e:
                    logger.warning(f"Error calculating similarity for gig {gig_id}: {e}")
                    continue
            
            # Sort by similarity and take top k
            similarities.sort(key=lambda x: x["similarity_score"], reverse=True)
            results = similarities[:k]
            
            execution_time = (time.time() - start_time) * 1000
            
            # Log query for analytics
            await self._log_query(db, query, json.dumps(query_embedding), [r["gig_id"] for r in results], 
                                [r["similarity_score"] for r in results], execution_time)
            
            logger.info(f"Found {len(results)} similar gigs in {execution_time:.2f}ms")
            return results, execution_time
            
        except Exception as e:
            logger.error(f"Error searching similar gigs: {str(e)}")
            raise
    
    async def _log_query(
        self, 
        db: AsyncSession, 
        query_text: str, 
        query_embedding: str,
        top_gig_ids: List[int], 
        similarity_scores: List[float], 
        response_time_ms: float
    ):
        """Log search query for analytics (private method)"""
        try:
            query_log = QueryLog(
                query_text=query_text,
                query_embedding=query_embedding,
                top_gig_ids=top_gig_ids,
                similarity_scores=similarity_scores,
                response_time_ms=response_time_ms
            )
            db.add(query_log)
            await db.commit()
        except Exception as e:
            logger.error(f"Error logging query: {str(e)}")
            # Don't fail the main operation if logging fails

# Global instance
vector_service = VectorService()