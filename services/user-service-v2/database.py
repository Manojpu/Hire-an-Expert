from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from config import settings
import ssl



# Async database engine
async_engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    future=True
)

# Sync database engine (for Alembic)
sync_engine = create_engine(
    settings.sync_database_url,
    echo=settings.debug
)

# Async session factory
AsyncSessionLocal = sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False
) 

# Sync session factory (for Alembic)
SyncSessionLocal = sessionmaker(
    sync_engine,
    expire_on_commit=False
)

# Base class for models
Base = declarative_base()


async def get_async_db():
    """Dependency to get async database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


def get_sync_db():
    """Dependency to get sync database session (for Alembic)"""
    with SyncSessionLocal() as session:
        try:
            yield session
        finally:
            session.close()