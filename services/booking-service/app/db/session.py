from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from app.core.config import settings

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

# For development/testing purposes - returns a mock user ID
# In a real application, this would verify JWT tokens and extract the user ID
def get_current_user_id():
    # TODO: Implement proper authentication with JWT tokens
    # For now, return a hardcoded user ID for testing purposes only
    return 1  # Mock user ID for development
