from fastapi import FastAPI, Depends
from app.db import session, models
from app.endpoints import booking
from sqlalchemy.exc import OperationalError


app = FastAPI(title="Booking Service")

# Create database tables if they don't exist
# Note: In production, you would use alembic migrations instead of this approach
try:
    print("Creating database tables if they don't exist...")
    models.Base.metadata.create_all(bind=session.engine)
    print("Database setup completed successfully!")
except OperationalError as e:
    print(f"Database connection failed: {e}")
    print("Make sure your database is running. You can start it with 'docker-compose up -d'")

# Include the booking router
app.include_router(booking.router, prefix="/bookings", tags=["bookings"])

@app.get("/")
def read_root():
    return {"Booking Service": "Running"}

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy"}


# uvicorn main:app --reload
