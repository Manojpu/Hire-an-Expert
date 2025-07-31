from fastapi import FastAPI
from app.api.endpoints import profiles 
from app.db.database import engine
from app.models import profile as profile_model

# Create the database tables based on your models/profile.py file
profile_model.Base.metadata.create_all(bind=engine)

# Create the main FastAPI application instance
app = FastAPI(title="User Profile Service")


# All routes from profiles.py will now be available under the "/api/profiles" path
app.include_router(profiles.router, prefix="/api/profiles", tags=["profiles"])

@app.get("/")
def read_root():
    """A simple health check endpoint for the service."""
    return {"service": "User Profile Service is running"}