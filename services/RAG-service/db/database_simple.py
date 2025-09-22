"""
Simple working database configuration for RAG service.
This version avoids import issues by using environment variables directly.
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
import os

# Get configuration from environment variables with fallbacks
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql+asyncpg://rag_user:rag_password@localhost:5433/rag_db')
DEBUG = os.getenv('DEBUG', 'true').lower() == 'true'
PORT = int(os.getenv('PORT', '8004'))

print(f"🔧 Database URL: {DATABASE_URL}")
print(f"🔧 Debug mode: {DEBUG}")
print(f"🔧 Port: {PORT}")

# Create the async database engine
try:
    engine = create_async_engine(
        DATABASE_URL,
        echo=DEBUG,
        future=True
    )
    print("✅ Database engine created successfully")
except Exception as e:
    print(f"❌ Failed to create database engine: {e}")
    engine = None

# Create session factory
if engine:
    try:
        async_session_maker = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
        print("✅ Database session factory created")
    except Exception as e:
        print(f"❌ Failed to create session factory: {e}")
        async_session_maker = None
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

# Simple settings class for compatibility
class Settings:
    DATABASE_URL = DATABASE_URL
    DEBUG = DEBUG
    PORT = PORT
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', 'your-openai-api-key-here')
    EMBEDDING_MODEL = os.getenv('EMBEDDING_MODEL', 'text-embedding-3-small')
    CHAT_MODEL = os.getenv('CHAT_MODEL', 'gpt-4o-mini')
    GIG_SERVICE_URL = os.getenv('GIG_SERVICE_URL', 'http://localhost:8002')
    REVIEW_SERVICE_URL = os.getenv('REVIEW_SERVICE_URL', 'http://localhost:8003')
    TOP_K_RESULTS = int(os.getenv('TOP_K_RESULTS', '5'))
    SIMILARITY_THRESHOLD = float(os.getenv('SIMILARITY_THRESHOLD', '0.7'))
    MAX_CONTEXT_LENGTH = int(os.getenv('MAX_CONTEXT_LENGTH', '4000'))

# Create a settings instance
settings = Settings()

print("✅ Database module loaded successfully")