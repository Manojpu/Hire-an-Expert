# filepath: services/rag-service/app/main.py
"""
Main FastAPI application entry point.
This is where everything comes together.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import sys
import os

# Add the parent directories to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)
sys.path.append(current_dir)

# Add specific directories
sys.path.append(os.path.join(parent_dir, 'db'))
sys.path.append(os.path.join(current_dir, 'core'))
sys.path.append(os.path.join(current_dir, 'api'))
sys.path.append(os.path.join(current_dir, 'utils'))

# Import modules with error handling
try:
    from database_simple import engine, Base, settings as db_settings
    print("✅ Database imported successfully")
    # Use database settings if config import fails
    if 'settings' not in locals():
        settings = db_settings
except ImportError as e:
    try:
        from database import engine, Base
        print("✅ Database imported successfully")
    except ImportError as e:
        print(f"⚠️ Database import failed: {e}")
        engine = None
        Base = None

try:
    import endpoints
    print("✅ Endpoints imported successfully")
except ImportError as e:
    print(f"⚠️ Endpoints import failed: {e}")
    endpoints = None

try:
    from config import settings
    print("✅ Config imported successfully")
except ImportError as e:
    print(f"⚠️ Config import failed: {e}")
    # Fallback settings
    class FallbackSettings:
        PORT = 8004
        DEBUG = True
    settings = FallbackSettings()

try:
    from logger import get_logger
    logger = get_logger(__name__)
    print("✅ Logger imported successfully")
except ImportError as e:
    print(f"⚠️ Logger import failed: {e}")
    import logging
    logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events"""
    # Startup
    logger.info("Starting RAG Service...")
    
    # Create database tables if possible
    if engine and Base:
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables created/verified")
        except Exception as e:
            logger.warning(f"Database setup failed: {e}")
    
    logger.info(f"RAG Service ready on port {settings.PORT}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down RAG Service...")

# Create FastAPI app
app = FastAPI(
    title="RAG Service",
    description="Retrieval-Augmented Generation service for Expert Marketplace",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes if available
if endpoints and hasattr(endpoints, 'router'):
    app.include_router(endpoints.router, prefix="/api/v1", tags=["rag"])
    logger.info("✅ API routes included")
else:
    logger.warning("⚠️ API routes not available")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "RAG Service is running", 
        "version": "1.0.0",
        "status": "healthy",
        "components": {
            "database": engine is not None,
            "endpoints": endpoints is not None,
            "config": settings is not None
        }
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "service": "rag-service",
        "components": {
            "database": "available" if engine else "unavailable",
            "endpoints": "available" if endpoints else "unavailable",
            "config": "available" if settings else "unavailable"
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=settings.PORT,
        reload=settings.DEBUG
    )