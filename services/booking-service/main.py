from fastapi import FastAPI, Depends, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.db import session, models
from app.db.seed import seed_database
from app.endpoints import booking
from sqlalchemy.exc import OperationalError
from app.core.logging import logger
import traceback


app = FastAPI(title="Booking Service")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, specify your frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler
@app.middleware("http")
async def log_exceptions(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as exc:
        logger.error(f"Request to {request.url} failed with error: {exc}")
        logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": f"Internal server error: {str(exc)}"}
        )

# Create database tables if they don't exist
# Note: In production, you would use alembic migrations instead of this approach
try:
    logger.info("Creating database tables if they don't exist...")
    models.Base.metadata.create_all(bind=session.engine)
    logger.info("Database setup completed successfully!")
    
    # Seed the database with test data (temporarily disabled)
    # db = next(session.get_db())
    # seed_database(db)
    logger.info("Database seeding skipped - service ready")
except OperationalError as e:
    logger.error(f"Database connection failed: {e}")
    logger.info("Make sure your database is running. You can start it with 'docker-compose up -d'")

# Include the booking router
app.include_router(booking.router, prefix="/bookings", tags=["bookings"])

@app.get("/")
def read_root():
    return {"message": "Booking Service", "status": "Running", "port": 8003}

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "booking", "port": 8003}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8003, reload=True)
