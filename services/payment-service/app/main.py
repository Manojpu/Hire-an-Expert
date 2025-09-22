"""
Payment Service FastAPI Application
Handles payments, escrow, Stripe Connect, and commissions for Hire an Expert marketplace.
"""
from fastapi import FastAPI, Depends, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import logging
import os
import sys
from contextlib import asynccontextmanager

# Add current directory to Python path to fix imports
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, current_dir)
sys.path.insert(0, parent_dir)

# Now import our modules
try:
    from database import get_db, create_tables
    from endpoints import payments, experts, webhooks
    print("✅ Imported all modules successfully")
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("⚠️ Some features may not be available")
    
    # Create fallback functions
    def get_db():
        yield None
    
    def create_tables():
        pass
    
    # Create empty routers
    class EmptyRouter:
        def __init__(self):
            pass
    
    payments = EmptyRouter()
    experts = EmptyRouter()
    webhooks = EmptyRouter()
    payments.router = None
    experts.router = None
    webhooks.router = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events"""
    # Startup
    logger.info("Starting Payment Service...")
    
    # Create database tables
    try:
        create_tables()
        logger.info("Database tables created/verified")
    except Exception as e:
        logger.warning(f"Database setup failed: {e}")
    
    logger.info("Payment Service ready")
    yield
    
    # Shutdown
    logger.info("Shutting down Payment Service...")

# Create FastAPI app
app = FastAPI(
    title="Payment Service",
    description="Escrow-based payment service with Stripe Connect for marketplace platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/")
def read_root():
    return {
        "message": "Payment Service", 
        "status": "Running", 
        "version": "1.0.0",
        "features": [
            "Escrow payments",
            "Stripe Connect",
            "Commission handling",
            "Webhook processing"
        ]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "payment-service"}

# Include routers
try:
    if hasattr(payments, 'router') and payments.router:
        app.include_router(payments.router, prefix="/api/v1/payments", tags=["payments"])
        print("✅ Payments router included")
    
    if hasattr(experts, 'router') and experts.router:
        app.include_router(experts.router, prefix="/api/v1/experts", tags=["experts"])
        print("✅ Experts router included")
    
    if hasattr(webhooks, 'router') and webhooks.router:
        app.include_router(webhooks.router, prefix="/api/v1/webhooks", tags=["webhooks"])
        print("✅ Webhooks router included")
        
except Exception as e:
    print(f"⚠️ Error including routers: {e}")
    print("Service will run with basic endpoints only")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app", 
        host="127.0.0.1", 
        port=int(os.getenv("PORT", 8005)), 
        reload=os.getenv("DEBUG", "false").lower() == "true"
    )

