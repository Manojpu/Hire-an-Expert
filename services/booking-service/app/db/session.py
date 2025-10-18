from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from app.core.config import settings
import logging

# Import the authentication functionality
from app.core.firebase_auth import get_current_user_id as firebase_get_user_id

# Set up logger
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Get DATABASE_URL from environment variables or use the one from alembic.ini as fallback
DATABASE_URL = os.getenv("DATABASE_URL") or settings.DATABASE_URL
print(f"Connecting to database: {DATABASE_URL}")

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# Create sessionmaker instance
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Real implementation of get_current_user_id using Firebase authentication
# Re-export the function from firebase_auth module for backward compatibility
get_current_user_id = firebase_get_user_id
