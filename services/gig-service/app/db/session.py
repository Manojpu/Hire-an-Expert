from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import os
from dotenv import load_dotenv



from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import os
from dotenv import load_dotenv
import platform
import socket
import requests
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from firebase_admin import auth, credentials, initialize_app
import firebase_admin
import uuid
import logging

# Set up logger
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Force the database connection to use localhost when running outside of Docker
# DATABASE_URL from .env takes precedence, or else we use the one from settings
if os.getenv("DATABASE_URL"):
    # Use the one from .env file
    DATABASE_URL = os.getenv("DATABASE_URL")
else:
    # We're using settings or environment, make sure it works locally
    DATABASE_URL = "postgresql://gig_user:gig123@localhost:5434/gig_db"

print(f"Connecting to database: {DATABASE_URL}")

engine = create_engine(DATABASE_URL)

# Create sessionmaker instance
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Initialize Firebase Admin SDK if it's not already initialized
if not firebase_admin._apps:
    try:
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDK initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin SDK: {e}")

# Security scheme
security = HTTPBearer()

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Verify Firebase token and get user ID from user-service
def get_current_user_id(token: HTTPBearer = Depends(security)):
    try:
        # Verify Firebase token
        token_value = token.credentials
        logger.debug(f"🔐 Attempting to verify token: {token_value[:20]}...")
        
        # Verify the token with Firebase
        decoded_token = auth.verify_id_token(token_value)
        firebase_uid = decoded_token['uid']
        logger.info(f"✅ Token verified successfully for Firebase UID: {firebase_uid}")
        
        # Use the user-service to get the user ID
        user_service_url = "http://localhost:8006/users/by-firebase-uid/" + firebase_uid
        
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
            
        # Fallback: If we can't get the ID from the user service, use firebase_uid
        logger.warning("Using Firebase UID as fallback")
        return firebase_uid
            
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