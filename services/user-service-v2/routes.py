from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
import os
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import uuid
from database import SyncSessionLocal, get_async_db
from models import User, UserRole
from schemas import (
    UserCreate, UserUpdate, UserResponse, UserWithPreferences,
    PreferenceCreate, PreferenceUpdate, PreferenceResponse, PreferenceBulkCreate,
    SuccessResponse, PaginationParams, PaginatedResponse, UserOut, ProvisionIn
)
from crud import (
    create_user, get_user_by_id, get_user_by_firebase_uid, get_users, update_user, delete_user,
    get_user_with_preferences, get_user_preferences, get_user_preference,
    create_user_preference, update_user_preference, delete_user_preference,
    create_or_update_user_preference, bulk_create_preferences,
    firebase_uid_exists, email_exists, upsert_user
)
from auth import get_current_user, get_current_admin, get_user_by_id_or_current, get_optional_user

router = APIRouter()

WEBHOOK_SECRET = os.getenv("USER_SERVICE_WEBHOOK_SECRET")

def get_db():
    db = SyncSessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/health")
def health():
    return {"ok": True}

@router.post("/internal/users/provision", response_model=UserOut)
async def provision_user(request: Request, db: Session = Depends(get_db)):
    provided = request.headers.get("X-Webhook-Secret")
    if not WEBHOOK_SECRET or provided != WEBHOOK_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook secret"
        )

    data = await request.json()
    payload = ProvisionIn(**data)
    user = upsert_user(
        db, uid=payload.firebase_uid, email=payload.email, full_name=payload.full_name
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


@router.get("/users/{user_id}/profile", response_model=UserWithPreferences)
async def get_user_profile(
    user_id: str,
    current_user: User = Depends(get_user_by_id_or_current),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get user profile with preferences
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    user = await get_user_with_preferences(db, user_uuid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
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
    if user_data.email and await email_exists(db, user_data.email, exclude_user_id=user_uuid):
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


# Preference endpoints
@router.get("/users/{user_id}/preferences", response_model=List[PreferenceResponse])
async def get_user_preferences_endpoint(
    user_id: str,
    current_user: User = Depends(get_user_by_id_or_current),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get all preferences for a user
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    preferences = await get_user_preferences(db, user_uuid)
    return preferences


@router.post("/users/{user_id}/preferences", response_model=PreferenceResponse)
async def create_user_preference_endpoint(
    user_id: str,
    preference_data: PreferenceCreate,
    current_user: User = Depends(get_user_by_id_or_current),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Create a new preference for a user
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    # Check if preference already exists
    existing_preference = await get_user_preference(db, user_uuid, preference_data.key)
    if existing_preference:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Preference with this key already exists"
        )
    
    preference = await create_user_preference(db, user_uuid, preference_data)
    return preference


@router.put("/users/{user_id}/preferences/{key}", response_model=PreferenceResponse)
async def update_user_preference_endpoint(
    user_id: str,
    key: str,
    preference_data: PreferenceUpdate,
    current_user: User = Depends(get_user_by_id_or_current),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Update a specific preference for a user
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    updated_preference = await update_user_preference(db, user_uuid, key, preference_data)
    if not updated_preference:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preference not found"
        )
    
    return updated_preference


@router.delete("/users/{user_id}/preferences/{key}", response_model=SuccessResponse)
async def delete_user_preference_endpoint(
    user_id: str,
    key: str,
    current_user: User = Depends(get_user_by_id_or_current),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Delete a specific preference for a user
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    success = await delete_user_preference(db, user_uuid, key)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preference not found"
        )
    
    return SuccessResponse(message="Preference deleted successfully")


@router.post("/users/{user_id}/preferences/bulk", response_model=List[PreferenceResponse])
async def bulk_create_preferences_endpoint(
    user_id: str,
    preferences_data: PreferenceBulkCreate,
    current_user: User = Depends(get_user_by_id_or_current),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Bulk create preferences for a user
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    preferences = await bulk_create_preferences(db, user_uuid, preferences_data.preferences)
    return preferences


@router.put("/users/{user_id}/preferences/upsert", response_model=PreferenceResponse)
async def upsert_user_preference_endpoint(
    user_id: str,
    preference_data: PreferenceCreate,
    current_user: User = Depends(get_user_by_id_or_current),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Create or update a preference for a user (upsert)
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    preference = await create_or_update_user_preference(db, user_uuid, preference_data)
    return preference 