from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth, credentials, initialize_app
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import firebase_admin
import logging
from config import settings
from database import get_async_db
from models import User, UserRole

# Set up logger
logger = logging.getLogger(__name__)


# Initialize Firebase Admin SDK
try:
    firebase_admin.get_app()
    logger.info("Firebase app already initialized")
except ValueError:
    logger.info("Initializing Firebase Admin SDK...")

    cred = credentials.Certificate({
        "type": "service_account",
        "project_id": settings.firebase_project_id,
        "private_key_id": settings.firebase_private_key_id,
        "private_key": settings.firebase_private_key.replace("\\n", "\n"),
        "client_email": settings.firebase_client_email,
        "client_id": settings.firebase_client_id,
        "auth_uri": settings.firebase_auth_uri,
        "token_uri": settings.firebase_token_uri,
        "auth_provider_x509_cert_url": settings.firebase_auth_provider_x509_cert_url,
        "client_x509_cert_url": settings.firebase_client_x509_cert_url,
    })

    initialize_app(cred)
    logger.info("Firebase Admin SDK initialized successfully")

# Security scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_async_db)
) -> User:
    """
    Get current authenticated user from Firebase token
    """
    try:
        # Verify Firebase token
        token = credentials.credentials
        logger.debug(f"🔐 Attempting to verify token: {token[:50]}...")
        logger.debug(f"🔐 Token length: {len(token)}")
        logger.debug(f"🔐 Token type: {type(token)}")
        
        # Add Firebase app info
        try:
            app = firebase_admin.get_app()
            logger.debug(f"🔐 Firebase app initialized: {app.project_id}")
        except Exception as app_error:
            logger.error(f"🔐 Firebase app error: {app_error}")
        
        decoded_token = auth.verify_id_token(token)
        firebase_uid = decoded_token['uid']
        logger.info(f"✅ Token verified successfully for Firebase UID: {firebase_uid}")
        logger.debug(f"✅ Decoded token keys: {list(decoded_token.keys())}")
        
        # Get user from database
        result = await db.execute(select(User).where(User.firebase_uid == firebase_uid))
        user = result.scalar_one_or_none()
        
        if not user:
            logger.warning(f"User not found in database for Firebase UID: {firebase_uid}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        logger.info(f"User found in database: {user.id}")
        return user
        
    except auth.InvalidIdTokenError as e:
        logger.error(f"Invalid ID token error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        logger.error(f"Error type: {type(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )


async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current user and verify they are an admin
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


async def get_user_by_id_or_current(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
) -> User:
    """
    Get user by ID or return current user if ID matches
    Admin can access any user
    """
    import uuid
    
    try:
        target_user_id = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format!!"
        )
    
    # Admin can access any user
    if current_user.role == UserRole.ADMIN:
        result = await db.execute(select(User).where(User.id == target_user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user
    
    # Regular users can only access their own profile
    if current_user.id != target_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return current_user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_async_db)
) -> Optional[User]:
    """
    Get current user if authenticated, otherwise return None
    Used for public endpoints that can work with or without authentication
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None 