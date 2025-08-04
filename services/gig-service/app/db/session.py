from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import os
from dotenv import load_dotenv


# Load environment variables from .env file
load_dotenv()

# Get DATABASE_URL from environment variables or use settings as fallback
DATABASE_URL = os.getenv("DATABASE_URL") or settings.DATABASE_URL
print(f"Connecting to database: {DATABASE_URL}")

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
