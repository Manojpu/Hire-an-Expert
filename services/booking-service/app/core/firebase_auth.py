from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth, credentials, initialize_app
import firebase_admin
import logging
import requests
import os
from dotenv import load_dotenv
from app.core.config import settings

# Load environment variables
load_dotenv()

# Set up logger
logger = logging.getLogger(__name__)

# Security scheme
security = HTTPBearer()

# Initialize Firebase Admin SDK
def initialize_firebase():
    if not firebase_admin._apps:
        try:
            # Look for the serviceAccountKey.json file
            if os.path.exists("serviceAccountKey.json"):
                cred = credentials.Certificate("serviceAccountKey.json")
                firebase_admin.initialize_app(cred)
                logger.info("Firebase Admin SDK initialized successfully")
            else:
                logger.error("serviceAccountKey.json not found")
                raise FileNotFoundError("serviceAccountKey.json not found")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
            raise


# Verify Firebase token and get user ID
def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        # Verify Firebase token
        token = credentials.credentials
        logger.debug(f"🔐 Attempting to verify token: {token[:20]}...")
        
        # Verify the token with Firebase
        decoded_token = auth.verify_id_token(token)
        firebase_uid = decoded_token['uid']
        logger.info(f"✅ Token verified successfully for Firebase UID: {firebase_uid}")
        
        # Use the auth-service to get the user ID
        user_service_url = f"{settings.USER_SERVICE_URL}/users/by-firebase-uid/{firebase_uid}"
        
        # Call user service to get user information
        try:
            response = requests.get(user_service_url)
            if response.status_code == 200:
                user_data = response.json()
                user_id = user_data.get("id")
                if user_id:
                    logger.info(f"User ID retrieved from user-service: {user_id}")
                    return user_id
                else:
                    logger.error("User ID not found in response")
            else:
                logger.error(f"Failed to retrieve user data: {response.status_code}")
        except requests.RequestException as e:
            logger.error(f"Request to user-service failed: {e}")

        # Throw an error if we can't get the ID from the user service
        logger.warning("Using Firebase UID as fallback")
        raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Failed to get user ID from user service."
    )

        
            
    except auth.InvalidIdTokenError as e:
        logger.error(f"Invalid ID token error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )

# Initialize Firebase on module import
initialize_firebase()