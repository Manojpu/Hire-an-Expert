"""
Database configuration and session management for Payment Service.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
import os
from typing import Generator

# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://payment_user:payment_password@localhost:5432/payment_db"
)

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    echo=os.getenv("DB_ECHO", "false").lower() == "true"  # Enable SQL logging in debug mode
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    """
    Dependency function to get database session.
    Ensures session is properly closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    """Create all database tables"""
    from models import Base
    Base.metadata.create_all(bind=engine)

def drop_tables():
    """Drop all database tables (use with caution!)"""
    from models import Base
    Base.metadata.drop_all(bind=engine)