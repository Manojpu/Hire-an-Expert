from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.endpoints.reviews import router as reviews_router
from app.db.database import engine
from app.models import review, review_helpful
from app.core.config import settings

# Note: Tables are now created using Alembic migrations
# Run: alembic upgrade head to create/update database tables

app = FastAPI(
    title="Review Service API",
    description="A comprehensive review system for the Hire-an-Expert platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(reviews_router, prefix="/reviews", tags=["reviews"])

@app.get("/")
def read_root():
    return {
        "service": "Review Service",
        "status": "running",
        "version": "1.0.0",
        "description": "Comprehensive review system for Hire-an-Expert platform"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "review-service"
    }

if __name__ == "__main__":
    import uvicorn
    import os
    
    port = int(os.getenv("PORT", 8007))
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"🚀 Starting Review Service on {host}:{port}")
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )



