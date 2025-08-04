from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List, Optional

from . import crud, schemas, dependencies
from .database import get_db, Base, engine
from .models import User as DBUser

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="User Service - Hire an Expert Platform",
    description="Comprehensive user management service for expert hiring platform",
    version="1.0.0"
)

# --- Authentication Endpoints ---
@app.post("/auth/login", response_model=schemas.Token)
async def login_for_access_token(
    db: Session = Depends(get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """Login endpoint for users"""
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not crud.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=dependencies.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = dependencies.create_access_token(
        data={"sub": str(user.id), "roles": [user.role]}, 
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@app.post("/auth/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new client user"""
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    return crud.create_user(db=db, user=user, role="client")

@app.post("/auth/register/expert", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
async def register_expert(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new expert user"""
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    return crud.create_user(db=db, user=user, role="expert")

# --- User Profile Endpoints ---
@app.get("/users/me", response_model=schemas.UserResponse)
async def read_users_me(current_user: DBUser = Depends(dependencies.get_current_user_from_token)):
    """Get current user profile"""
    return current_user

@app.put("/users/me", response_model=schemas.UserResponse)
async def update_user_profile(
    user_update: schemas.UserUpdate,
    current_user: DBUser = Depends(dependencies.get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    updated_user = crud.update_user(db, current_user.id, user_update)
    if not updated_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return updated_user

@app.get("/users/{user_id}", response_model=schemas.UserResponse)
async def get_user_by_id(
    user_id: int,
    current_user: DBUser = Depends(dependencies.get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get user by ID (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

# --- Expert Profile Endpoints ---
@app.post("/experts/profile", response_model=schemas.ExpertProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_expert_profile(
    expert_profile: schemas.ExpertProfileCreate,
    current_user: DBUser = Depends(dependencies.get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create expert profile for current user"""
    if current_user.role != "expert":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only experts can create expert profiles")
    
    existing_profile = crud.get_expert_profile_by_user_id(db, current_user.id)
    if existing_profile:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Expert profile already exists")
    
    return crud.create_expert_profile(db, current_user.id, expert_profile)

@app.get("/experts/profile/me", response_model=schemas.ExpertProfileResponse)
async def get_my_expert_profile(
    current_user: DBUser = Depends(dependencies.get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get current user's expert profile"""
    if current_user.role != "expert":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only experts can access expert profiles")
    
    profile = crud.get_expert_profile_by_user_id(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expert profile not found")
    return profile

@app.put("/experts/profile/me", response_model=schemas.ExpertProfileResponse)
async def update_my_expert_profile(
    expert_update: schemas.ExpertProfileUpdate,
    current_user: DBUser = Depends(dependencies.get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update current user's expert profile"""
    if current_user.role != "expert":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only experts can update expert profiles")
    
    profile = crud.get_expert_profile_by_user_id(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expert profile not found")
    
    updated_profile = crud.update_expert_profile(db, profile.id, expert_update)
    return updated_profile

@app.get("/experts/{expert_id}", response_model=schemas.ExpertProfileResponse)
async def get_expert_profile(
    expert_id: int,
    db: Session = Depends(get_db)
):
    """Get expert profile by ID (public endpoint)"""
    profile = crud.get_expert_profile(db, expert_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expert profile not found")
    return profile

@app.get("/experts", response_model=schemas.ExpertSearchResponse)
async def search_experts(
    categories: Optional[List[str]] = Query(None),
    skills: Optional[List[str]] = Query(None),
    min_rating: Optional[float] = Query(None),
    max_hourly_rate: Optional[float] = Query(None),
    location: Optional[str] = Query(None),
    is_available: Optional[bool] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Search and filter experts (public endpoint)"""
    search_params = schemas.ExpertSearchParams(
        categories=categories,
        skills=skills,
        min_rating=min_rating,
        max_hourly_rate=max_hourly_rate,
        location=location,
        is_available=is_available,
        limit=limit,
        offset=offset
    )
    experts, total = crud.search_experts(db, search_params)
    return schemas.ExpertSearchResponse(
        experts=experts,
        total=total,
        limit=limit,
        offset=offset
    )

# --- Expert Services Endpoints ---
@app.post("/experts/services", response_model=schemas.ExpertServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_expert_service(
    service: schemas.ExpertServiceCreate,
    current_user: DBUser = Depends(dependencies.get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create a new service for current expert"""
    if current_user.role != "expert":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only experts can create services")
    
    profile = crud.get_expert_profile_by_user_id(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expert profile not found")
    
    return crud.create_expert_service(db, profile.id, service)

@app.get("/experts/services/me", response_model=List[schemas.ExpertServiceResponse])
async def get_my_expert_services(
    current_user: DBUser = Depends(dependencies.get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get current expert's services"""
    if current_user.role != "expert":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only experts can access services")
    
    profile = crud.get_expert_profile_by_user_id(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expert profile not found")
    
    return crud.get_expert_services(db, profile.id)

@app.put("/experts/services/{service_id}", response_model=schemas.ExpertServiceResponse)
async def update_expert_service(
    service_id: int,
    service_update: schemas.ExpertServiceUpdate,
    current_user: DBUser = Depends(dependencies.get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update expert service"""
    if current_user.role != "expert":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only experts can update services")
    
    updated_service = crud.update_expert_service(db, service_id, service_update)
    if not updated_service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    return updated_service

@app.delete("/experts/services/{service_id}")
async def delete_expert_service(
    service_id: int,
    current_user: DBUser = Depends(dependencies.get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Delete expert service"""
    if current_user.role != "expert":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only experts can delete services")
    
    success = crud.delete_expert_service(db, service_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    return {"message": "Service deleted successfully"}

# --- Client Profile Endpoints ---
@app.post("/clients/profile", response_model=schemas.ClientProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_client_profile(
    client_profile: schemas.ClientProfileCreate,
    current_user: DBUser = Depends(dependencies.get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create client profile for current user"""
    if current_user.role != "client":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only clients can create client profiles")
    
    existing_profile = crud.get_client_profile_by_user_id(db, current_user.id)
    if existing_profile:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Client profile already exists")
    
    return crud.create_client_profile(db, current_user.id, client_profile)

@app.get("/clients/profile/me", response_model=schemas.ClientProfileResponse)
async def get_my_client_profile(
    current_user: DBUser = Depends(dependencies.get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get current user's client profile"""
    if current_user.role != "client":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only clients can access client profiles")
    
    profile = crud.get_client_profile_by_user_id(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client profile not found")
    return profile

@app.put("/clients/profile/me", response_model=schemas.ClientProfileResponse)
async def update_my_client_profile(
    client_update: schemas.ClientProfileUpdate,
    current_user: DBUser = Depends(dependencies.get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update current user's client profile"""
    if current_user.role != "client":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only clients can update client profiles")
    
    profile = crud.get_client_profile_by_user_id(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client profile not found")
    
    updated_profile = crud.update_client_profile(db, profile.id, client_update)
    return updated_profile

# --- Category and Skills Endpoints ---
@app.get("/categories", response_model=List[schemas.CategoryResponse])
async def get_categories():
    """Get all available categories"""
    return crud.get_categories()

@app.get("/skills/{category}", response_model=List[schemas.SkillResponse])
async def get_skills_by_category(category: str):
    """Get skills for a specific category"""
    return crud.get_skills_by_category(category)

# --- Health Check ---
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "user-service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)