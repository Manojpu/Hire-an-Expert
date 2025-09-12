from fastapi import FastAPI, HTTPException, status, Request, Depends
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
from config import settings
from database import async_engine, Base
from routes import router
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting User Service...")
    
    # Create database tables (for development)
    if settings.debug:
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created")
    
    yield
    
    # Shutdown
    logger.info("Shutting down User Service...")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="User Service for Hire an Expert Platform",
    docs_url="/",
    redoc_url="/redoc",
    lifespan=lifespan,
    openapi_tags=[
        {"name": "Users", "description": "User management operations"},
        {"name": "Preferences", "description": "User preferences management"},
        {"name": "Verification Documents", "description": "Document upload and verification"},
        {"name": "Expert Verification", "description": "Expert profile verification"}
    ]
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    logger.debug("Health check requested")
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Welcome to Hire Expert User Service",
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health"
    }


# Include routes
app.include_router(router)


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="debug"
    ) 