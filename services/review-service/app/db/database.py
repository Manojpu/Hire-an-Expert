from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import dotenv
import os

# Load environment variables from .env file
dotenv.load_dotenv()

# Get the database URL from the environment variable set in docker-compose.yml
DATABASE_URL = os.getenv("DATABASE_URL")

# Create the SQLAlchemy engine, which is the entry point to our database
engine = create_engine(DATABASE_URL)

# Each instance of the SessionLocal class will be a new database session.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base will be used as a base class for our SQLAlchemy models (like the Review model)
Base = declarative_base()

# This is a dependency that we will use in our API endpoints to get a database session.
# It ensures that the database session is always closed after the request is finished.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()