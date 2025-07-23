from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from . import crud, schemas, dependencies
from .database import get_db, Base, engine
from .models import User as DBUser # Alias to avoid conflict with `schemas.UserResponse`

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="User Service")

# --- Authentication Endpoints ---
@app.post("/login", response_model=schemas.Token)
async def login_for_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not crud.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=dependencies.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = dependencies.create_access_token(
        data={"sub": str(user.id), "roles": [user.role]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    return crud.create_user(db=db, user=user, role="client") # Default to client role

@app.post("/register/expert", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
async def register_expert(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    return crud.create_user(db=db, user=user, role="expert") # Explicitly set expert role

# --- Protected User Profile Endpoint ---
@app.get("/me", response_model=schemas.UserResponse)
async def read_users_me(current_user: DBUser = Depends(dependencies.get_current_user_from_token)):
    return current_user

# Add more user-specific endpoints (get user by ID, update user profile, etc.)