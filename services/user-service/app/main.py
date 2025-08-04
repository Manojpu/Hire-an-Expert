from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import profile
from app.api.endpoints import testing
from app.db.database import engine
from app.models import profile as profile_model
from app.core.test_config import is_testing_mode

# Create the database tables if they don't exist
profile_model.Base.metadata.create_all(bind=engine)

# Create the main FastAPI application
app = FastAPI(
    title="User Profile Service",
    description="API for managing user profiles in the Hire-an-Expert platform",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(
    profile.router, 
    prefix="/api/profiles", 
    tags=["profiles"]
)

# Include test endpoints if in testing mode
if is_testing_mode():
    app.include_router(
        testing.router,
        prefix="/api/test",
        tags=["testing"]
    )
    print("WARNING: Testing mode is enabled. Test endpoints are available at /api/test/*")

@app.get("/", tags=["health"])
async def health_check():
    """Health check endpoint for the service."""
    return {"status": "healthy", "service": "User Profile Service"}

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests"""
    print(f"Request: {request.method} {request.url.path}")
    response = await call_next(request)
    return response