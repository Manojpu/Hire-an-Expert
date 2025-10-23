from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth, credentials, initialize_app
from typing import Optional
import firebase_admin
import logging
from pydantic import BaseModel
import os
import httpx

# Set up logger
logger = logging.getLogger(__name__)

# User model for authentication - simplified for review service
class User(BaseModel):
    sub: str  # Firebase UID
    email: str
    name: Optional[str] = None
    original_token: Optional[str] = None

# Token data model
class TokenData(BaseModel):
    sub: str
    email: Optional[str] = None

# Initialize Firebase Admin SDK
if not firebase_admin._apps:
    try:
        # Try to load from service account key file (use absolute path)
        service_account_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "serviceAccountKey.json")
        if os.path.exists(service_account_path):
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred)
            logger.info(f"✅ Firebase initialized successfully from {service_account_path}")
        elif os.path.exists("/app/serviceAccountKey.json"):
            cred = credentials.Certificate("/app/serviceAccountKey.json")
            firebase_admin.initialize_app(cred)
            logger.info("✅ Firebase initialized successfully from /app/serviceAccountKey.json")
        else:
            logger.warning(f"⚠️ serviceAccountKey.json not found at {service_account_path} or /app/serviceAccountKey.json - Firebase authentication disabled")
    except Exception as e:
        logger.warning(f"⚠️ Could not initialize Firebase: {e}")

# Security scheme
security = HTTPBearer()
USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://user-service:8006")

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """
    Get current authenticated user from Firebase token
    """
    try:
        # Verify Firebase token
        token = credentials.credentials
        logger.debug(f"🔐 Attempting to verify token: {token[:50]}...")
        
        if not firebase_admin._apps:
            # For development without Firebase
            logger.warning("⚠️ Firebase not initialized - using mock user")
            return User(
                sub="dev-user-123",
                email="dev@example.com",
                name="Dev User",
                original_token=token
            )
        
        decoded_token = auth.verify_id_token(token)
        firebase_uid = decoded_token['uid']
        email = decoded_token.get('email', '')
        name = decoded_token.get('name', decoded_token.get('email', '').split('@')[0])
        
        logger.info(f"✅ Token verified successfully for Firebase UID: {firebase_uid}")
        
        return User(
            sub=firebase_uid,
            email=email,
            name=name,
            original_token=token
        )
        
    except auth.InvalidIdTokenError as e:
        logger.error(f"❌ Invalid ID token error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
    except Exception as e:
        logger.error(f"❌ Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )

def get_user_by_id_or_current(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Simplified version that just returns current user
    For review service, we don't need complex user ID resolution
    """
    return current_user

def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[User]:
    """
    Get current user if authenticated, otherwise return None
    """
    if not credentials:
        return None
    
    try:
        return get_current_user(credentials)
    except HTTPException:
        return None
