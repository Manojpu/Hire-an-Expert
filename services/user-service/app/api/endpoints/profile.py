from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.db.database import get_db
from app.schemas.profile import ProfileCreate, ProfileOut, ProfileUpdate
from app.crud import profile as profile_crud
from app.core.auth import get_current_user, TokenData

router = APIRouter()

@router.post("/", response_model=ProfileOut, status_code=status.HTTP_201_CREATED, summary="Create a user profile")
def create_user_profile(
    user_in: ProfileCreate, 
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Create a new user profile.
    The profile will be linked to the authenticated user's Firebase UID.
    """
    # Ensure the ID in the profile matches the authenticated user
    if user_in.id != current_user.sub:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile ID must match the authenticated user"
        )
    
    # Check if profile already exists
    existing_profile = profile_crud.get_profile(db, user_id=current_user.sub)
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Profile already exists for this user"
        )
    
    return profile_crud.create_profile(db, user_in)

@router.get("/me", response_model=ProfileOut, summary="Get own user profile")
def read_user_me(
    db: Session = Depends(get_db), 
    current_user: TokenData = Depends(get_current_user)
):
    """
    Fetches the profile of the currently authenticated user.
    """
    db_user = profile_crud.get_profile(db, user_id=current_user.sub)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User profile not found")
    return db_user

@router.put("/me", response_model=ProfileOut, summary="Update own user profile")
def update_user_me(
    profile_update: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Updates the profile of the currently authenticated user.
    """
    db_user = profile_crud.update_profile(db, user_id=current_user.sub, profile_data=profile_update)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User profile not found")
    return db_user

@router.get("/{profile_id}", response_model=ProfileOut, summary="Get user profile by ID")
def read_user_profile(
    profile_id: str,
    db: Session = Depends(get_db)
):
    """
    Fetches a user profile by ID (Firebase UID).
    This endpoint is public and can be used to view other users' profiles.
    """
    db_user = profile_crud.get_profile(db, user_id=profile_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User profile not found")
    return db_user

@router.delete("/{profile_id}", summary="Delete user profile by ID")
def delete_user_profile(
    profile_id: str,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Deletes a user profile by ID (Firebase UID).
    Only the owner of the profile can delete it.
    """
    if profile_id != current_user.sub:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own profile"
        )
    
    db_user = profile_crud.delete_profile(db, user_id=profile_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User profile not found")
    return {"detail": "Profile deleted successfully"}