"""
Analytics endpoints for gig performance metrics from review service.
Provides rating, review count, and performance data.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.db.models import Gig
import httpx
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# Review service URL
REVIEW_SERVICE_URL = settings.review_service_base_url.rstrip("/")


@router.get("/{gig_id}/performance")
async def get_gig_performance(
    gig_id: str,
    db: Session = Depends(get_db)
):
    """
    Get performance metrics for a specific gig.
    
    Returns:
    - Average rating
    - Total reviews
    - Response time
    - Repeat customer estimation (placeholder)
    """
    try:
        # Get gig details
        gig = db.query(Gig).filter(Gig.id == gig_id).first()
        if not gig:
            raise HTTPException(status_code=404, detail="Gig not found")
        
        # Fetch reviews from review service
        try:
            async with httpx.AsyncClient() as client:
                review_response = await client.get(
                    f"{REVIEW_SERVICE_URL}/reviews/gig/{gig_id}/stats",
                    timeout=5.0
                )
                
                if review_response.status_code == 200:
                    review_data = review_response.json()
                    avg_rating = review_data.get("average_rating", 0)
                    total_reviews = review_data.get("total_reviews", 0)
                else:
                    logger.warning(f"Review service returned {review_response.status_code} for gig {gig_id}")
                    avg_rating = 0
                    total_reviews = 0
                    
        except httpx.RequestError as e:
            logger.error(f"Error connecting to review service: {str(e)}")
            # Use fallback values if review service is unavailable
            avg_rating = 0
            total_reviews = 0
        
        # Return performance metrics
        return {
            "gigId": gig_id,
            "rating": round(avg_rating, 1),
            "totalReviews": total_reviews,
            "responseTime": gig.response_time or "< 24 hours",
            "repeatCustomers": 0,  # Placeholder - would need booking service data
            "avgSessionDuration": "45 min"  # Placeholder - would need booking service data
        }
        
    except Exception as e:
        logger.error(f"Error fetching performance for gig {gig_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching performance: {str(e)}")
