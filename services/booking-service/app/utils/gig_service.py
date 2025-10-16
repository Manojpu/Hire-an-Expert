import requests
from app.core.config import settings
from app.core.logging import logger
from typing import Dict, Any, Optional

def get_gig_details(gig_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetch gig details from the gig service by gig_id
    
    Args:
        gig_id: The ID of the gig to fetch
        
    Returns:
        Dict containing gig details or None if fetch fails
    """
    try:
        url = f"{settings.GIG_SERVICE_URL}/gigs/{gig_id}"
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            gig_data = response.json()
            return {
                "id": gig_data.get("id"),
                "expert_id": gig_data.get("expert_id"),
                "service_description": gig_data.get("service_description"),
                "thumbnail_url": gig_data.get("thumbnail_url"),
                "hourly_rate": gig_data.get("hourly_rate"),
                "currency": gig_data.get("currency", "LKR")
            }
        else:
            logger.error(f"Failed to fetch gig details. Status code: {response.status_code}, Response: {response.text}")
            return None
            
    except Exception as e:
        logger.error(f"Error fetching gig details for gig_id {gig_id}: {str(e)}")
        return None

def get_expert_details_for_booking(gig_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetch expert details from the gig service and user service for a booking.
    This is used for notification purposes.
    
    Args:
        gig_id: The ID of the gig associated with the booking
        
    Returns:
        Dict containing expert details or None if fetch fails
    """
    try:
        # First get the gig details to get the expert_id
        gig_data = get_gig_details(gig_id)
        if not gig_data:
            return None
            
        expert_id = gig_data.get("expert_id")
        if not expert_id:
            logger.error(f"No expert_id found for gig {gig_id}")
            return None
            
        # For notification purposes, we need minimal info
        return {
            "expert_id": expert_id,
            "service_name": gig_data.get("service_description", "Expert Service")
        }
    
    except Exception as e:
        logger.error(f"Error fetching expert details for gig_id {gig_id}: {str(e)}")
        return None