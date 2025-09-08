from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
import os
from config import settings
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import uuid
from database import SyncSessionLocal, get_async_db
from models import User, UserRole
from schemas import (
    UserCreate, UserUpdate, UserResponse, UserOut, ProvisionIn,
    SuccessResponse, PaginationParams, PaginatedResponse
) 
from crud import (
    create_user, get_user_by_email, get_user_by_id, get_user_by_firebase_uid, get_users, update_user, delete_user,
    firebase_uid_exists, email_exists, upsert_user
)
from auth import get_current_user, get_current_admin, get_user_by_id_or_current, get_optional_user

router = APIRouter()

# WEBHOOK_SECRET = settings.user_service_webhook_secret
WEBHOOK_SECRET = "7f6b8e2e6b9147f0b34a84d5b673d3e85d3a21b6b3c847c0a9e32f8f8a172ab4"

def get_db():
    db = SyncSessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/health")
def health():
    return {"ok": True}

# @router.post("/internal/users/provision", response_model=UserOut)
# async def provision_user(request: Request, db: Session = Depends(get_db)):
#     provided = request.headers.get("X-Webhook-Secret")
#     if not WEBHOOK_SECRET or provided != WEBHOOK_SECRET:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Invalid webhook secret"
#         )

#     data = await request.json()
#     payload = ProvisionIn(**data)
#     user = upsert_user(
#         db, uid=payload.firebase_uid, email=payload.email, full_name=payload.full_name
#     )
#     return user

@router.post("/internal/users/provision", response_model=UserOut)
async def provision_user(request: Request, db: Session = Depends(get_db)):
    secret = request.headers.get("X-Webhook-Secret")
    if WEBHOOK_SECRET and secret != WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Invalid secret")

    data = await request.json()
    payload = ProvisionIn(**data)

    user = upsert_user(
        db, 
        uid=payload.firebase_uid, 
        email=payload.email, 
        full_name=payload.full_name,
        is_expert=payload.is_expert,
        expert_profiles=payload.expert_profiles
    )
    return user

# Public endpoints 
@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_public(
    user_id: str,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get user by ID (public endpoint)
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    user = await get_user_by_id(db, user_uuid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.get("/users/firebase/{firebase_uid}", response_model=UserResponse)
async def get_user_by_firebase_uid_public(
    firebase_uid: str,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get user by Firebase UID (public endpoint)
    """
    user = await get_user_by_firebase_uid(db, firebase_uid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


# Authenticated endpoints
@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user_endpoint(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Create a new user
    """
    # Check if Firebase UID already exists
    if await firebase_uid_exists(db, user_data.firebase_uid):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this Firebase UID already exists"
        )
    
    # Check if email already exists
    if await email_exists(db, user_data.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists"
        )
    
    user = await create_user(db, user_data)
    return user





@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user_endpoint(
    user_id: str,
    user_data: UserUpdate,
    current_user: User = Depends(get_user_by_id_or_current),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Update user information
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    # Check if email already exists (if being updated)
    if user_data.email:
        existing_user = await get_user_by_email(db, user_data.email)
        if existing_user and existing_user.id != user_uuid:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists"
            )
    
    updated_user = await update_user(db, user_uuid, user_data)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return updated_user


# Admin-only endpoints
@router.get("/admin/users", response_model=PaginatedResponse)
async def get_users_admin(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    role: Optional[UserRole] = Query(None, description="Filter by role"),
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get all users (admin only)
    """
    skip = (page - 1) * size
    users = await get_users(db, skip=skip, limit=size, role=role)
    
    # Get total count for pagination
    total_users = await get_users(db, skip=0, limit=1000, role=role)
    total = len(total_users)
    pages = (total + size - 1) // size
    
    return PaginatedResponse(
        items=users,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.delete("/admin/users/{user_id}", response_model=SuccessResponse)
async def delete_user_admin(
    user_id: str,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Delete user (admin only)
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    # Prevent admin from deleting themselves
    if current_user.id == user_uuid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    success = await delete_user(db, user_uuid)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return SuccessResponse(message="User deleted successfully")


