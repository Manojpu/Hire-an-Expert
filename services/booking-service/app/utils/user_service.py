import requests
from app.core.config import settings
from app.core.logging import logger
from typing import Dict, Any, Optional

def get_user_details(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetch user details from the user service by user_id
    
    Args:
        user_id: The ID of the user to fetch
        
    Returns:
        Dict containing user details or None if fetch fails
    """
    try:
        # User service endpoint - try both formats
        url = f"{settings.USER_SERVICE_URL}/users/{user_id}"
        response = requests.get(url, timeout=2)
        
        if response.status_code == 200:
            user_data = response.json()
            return {
                "id": user_data.get("id"),
                "name": user_data.get("name") or user_data.get("full_name"),
                "email": user_data.get("email"),
                "avatar_url": user_data.get("avatar_url") or user_data.get("profile_image_url")
            }
        else:
            logger.warning(f"Failed to fetch user details for {user_id}. Status: {response.status_code}")
            return None
            
    except requests.exceptions.Timeout:
        logger.warning(f"Timeout fetching user details for {user_id}")
        return None
    except requests.exceptions.ConnectionError:
        logger.warning(f"Connection error fetching user details for {user_id}")
        return None
    except Exception as e:
        logger.error(f"Error fetching user details for user_id {user_id}: {str(e)}")
        return None
