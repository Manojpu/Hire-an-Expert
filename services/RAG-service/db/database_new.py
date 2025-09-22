"""
Database connection and session management.
This file sets up the PostgreSQL connection with async support.
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
import sys
import os

# Initialize configuration variables with defaults
DATABASE_URL = "postgresql+asyncpg://rag_user:rag_password@localhost:5433/rag_db"
DEBUG = True

# Try to import settings and override defaults
try:
    # Add the core directory to Python path to find config
    current_dir = os.path.dirname(__file__)
    parent_dir = os.path.dirname(current_dir)
    core_dir = os.path.join(parent_dir, 'core')
    sys.path.append(core_dir)
    
    from config import settings
    DATABASE_URL = settings.DATABASE_URL
    DEBUG = settings.DEBUG
    print("✅ Database using settings from config.py")
except ImportError as e:
    print(f"⚠️ Database using fallback configuration: {e}")
except Exception as e:
    print(f"⚠️ Error loading config, using defaults: {e}")

# Create the async database engine
try:
    engine = create_async_engine(
        DATABASE_URL,
        echo=DEBUG,  # Print SQL queries when debugging
        future=True
    )
    print(f"✅ Database engine created for: {DATABASE_URL}")
except Exception as e:
    print(f"❌ Failed to create database engine: {e}")
    engine = None

# Create session factory
if engine:
    async_session_maker = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
else:
    async_session_maker = None

# Base class for all database models
Base = declarative_base()

# Dependency function to get database session
async def get_db():
    """
    Dependency that provides a database session to API endpoints.
    Use this in your FastAPI endpoints like: db: AsyncSession = Depends(get_db)
    """
    if not async_session_maker:
        raise RuntimeError("Database not available")
        
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()