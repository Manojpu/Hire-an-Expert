"""
Service for calling other microservices (Gig Service, Review Service).
"""
import aiohttp
import asyncio
from typing import Dict, Any, List, Optional
import sys
import os

# Add paths to find modules
current_dir = os.path.dirname(__file__)
parent_dir = os.path.dirname(current_dir)
sys.path.append(os.path.join(parent_dir, 'core'))
sys.path.append(os.path.join(parent_dir, 'utils'))

try:
    from app.core.config import settings
except ImportError:
    # Fallback configuration
    class FallbackSettings:
        GIG_SERVICE_URL = "http://localhost:8002"
        REVIEW_SERVICE_URL = "http://localhost:8003"
    settings = FallbackSettings()

try:
    from utils.logger import get_logger
    logger = get_logger(__name__)
except ImportError:
    import logging
    logger = logging.getLogger(__name__)

class ExternalAPIService:
    """Handles communication with other microservices"""
    
    def __init__(self):
        self.gig_service_url = settings.GIG_SERVICE_URL
        self.review_service_url = settings.REVIEW_SERVICE_URL
        self.timeout = aiohttp.ClientTimeout(total=30)
    
    async def fetch_gig_details(self, gig_id: int) -> Optional[Dict[str, Any]]:
        """
        Fetch gig details from the Gig Service.
        
        Args:
            gig_id: ID of the gig to fetch
            
        Returns:
            Dictionary with gig details or None if not found
        """
        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                url = f"{self.gig_service_url}/api/v1/gigs/{gig_id}"
                async with session.get(url) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        logger.warning(f"Gig {gig_id} not found: {response.status}")
                        return None
        except Exception as e:
            logger.error(f"Error fetching gig {gig_id}: {str(e)}")
            return None
    
    async def fetch_gig_reviews(self, gig_id: int) -> List[Dict[str, Any]]:
        """
        Fetch reviews for a gig from the Review Service.
        
        Args:
            gig_id: ID of the gig
            
        Returns:
            List of review dictionaries
        """
        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                url = f"{self.review_service_url}/api/v1/reviews/gig/{gig_id}"
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get('reviews', [])
                    else:
                        logger.warning(f"Reviews for gig {gig_id} not found: {response.status}")
                        return []
        except Exception as e:
            logger.error(f"Error fetching reviews for gig {gig_id}: {str(e)}")
            return []
    
    def combine_gig_and_reviews(self, gig_data: Dict[str, Any], reviews: List[Dict[str, Any]]) -> str:
        """
        Combine gig information and reviews into a single text for embedding.
        
        Args:
            gig_data: Gig information from Gig Service
            reviews: List of reviews from Review Service
            
        Returns:
            Combined text string
        """
        parts = []
        
        # Add gig information
        parts.append(f"Title: {gig_data.get('title', '')}")
        parts.append(f"Category: {gig_data.get('category', '')}")
        parts.append(f"Description: {gig_data.get('description', '')}")
        
        # Add review information
        if reviews:
            parts.append("Reviews:")
            for review in reviews[:5]:  # Limit to first 5 reviews
                review_text = review.get('review_text', '')
                rating = review.get('rating', 0)
                if review_text:
                    parts.append(f"Review (Rating {rating}/5): {review_text}")
        
        return "\n".join(parts)

# Global instance
external_api_service = ExternalAPIService()