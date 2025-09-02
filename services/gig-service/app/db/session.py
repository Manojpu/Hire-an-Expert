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
    # For now, return a hardcoded expert ID for testing purposes only
    return 1  # Mock user ID for development
