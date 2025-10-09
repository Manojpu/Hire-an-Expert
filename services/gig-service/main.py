from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from alembic.config import Config
from alembic import command
import os
import contextlib
from typing import AsyncIterator
import logging
import time

from app.db import session
from app.endpoints import gig
from app.endpoints import category

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(os.path.dirname(__file__), "logs", "gig_service.log"), mode='a')
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Gig Service")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:8081",
        "http://localhost:5173",
        "http://localhost:4173",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = request.headers.get("X-Request-Id", "")
    start_time = time.time()
    
    logger.info(f"Request started: {request.method} {request.url.path} (ID: {request_id})")
    
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        logger.info(
            f"Request completed: {request.method} {request.url.path} "
            f"- Status: {response.status_code} - Duration: {process_time:.3f}s (ID: {request_id})"
        )
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(
            f"Request failed: {request.method} {request.url.path} "
            f"- Error: {str(e)} - Duration: {process_time:.3f}s (ID: {request_id})"
        )
        raise

# Health check
@app.get("/")
def read_root():
    logger.debug("Health check endpoint called")
    return {"message": "Gig Service", "status": "Running", "port": 8002}

app.include_router(gig.router, prefix="/gigs", tags=["gigs"])

app.include_router(category.router, prefix="/categories", tags=["categories"])

# 🚀 Run migrations using lifespan pattern instead of deprecated on_event
@contextlib.asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    try:
        # Startup: Run migrations before the application fully starts
        logger.info("🔄 Starting Gig Service - Applying migrations...")
        alembic_cfg = Config(os.path.join(os.path.dirname(__file__), "alembic.ini"))
        alembic_cfg.set_main_option("script_location", os.path.join(os.path.dirname(__file__), "alembic"))
        command.upgrade(alembic_cfg, "head")
        logger.info("✅ Database migrations completed successfully!")
    except Exception as e:
        logger.error(f"❌ Database migration failed: {str(e)}")
        raise
    
    yield  # Application runs here
    
    # Shutdown: Any cleanup code would go here
    logger.info("🛑 Shutting down Gig Service...")

# # Attach the lifespan handler to the app
# app.router.lifespan_context = lifespan

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Gig Service on port 8002")
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True, log_level="info")