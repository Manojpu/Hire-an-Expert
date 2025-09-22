"""
Data# Add the core directory to Python path to find config
current_dir = os.path.dirname(__file__)
parent_dir = os.path.dirname(current_dir)
core_dir = os.path.join(parent_dir, 'core')
sys.path.append(core_dir)

# Simple fallback configuration that will work
DATABASE_URL = "postgresql+asyncpg://rag_user:rag_password@localhost:5433/rag_db"
DEBUG = True

try:
    from config import settings
    DATABASE_URL = settings.DATABASE_URL
    DEBUG = settings.DEBUG
    print("✅ Using settings from config.py")
except ImportError:
    print("⚠️ Using fallback database configuration")n and session management.
This file sets up the PostgreSQL connection with async support.
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
import sys
import os

# Add the core directory to Python path to find config
current_dir = os.path.dirname(__file__)
parent_dir = os.path.dirname(current_dir)
core_dir = os.path.join(parent_dir, 'core')
sys.path.append(core_dir)

try:
    from app.core.config import settings
except ImportError:
    # Fallback configuration if config.py is not found
    class FallbackSettings:
        DATABASE_URL = "postgresql+asyncpg://rag_user:rag_password@localhost:5433/rag_db"
        DEBUG = True
    settings = FallbackSettings()

# Create the async database engine
engine = create_async_engine(
    DATABASE_URL,
    echo=DEBUG,  # Print SQL queries when debugging
    future=True
)

# Create session factory
async_session_maker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base class for all database models
Base = declarative_base()

# Dependency function to get database session
async def get_db():
    """
    Dependency that provides a database session to API endpoints.
    Use this in your FastAPI endpoints like: db: AsyncSession = Depends(get_db)
    """
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()