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