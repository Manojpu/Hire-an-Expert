from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.profile import ProfileCreate, ProfileOut
from app.crud import user as user_crud
from app.core.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=ProfileOut, summary="Create a user profile")
def create_user_profile(
    user_in: ProfileCreate, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    """
    Creates a user profile in the local DB.
    The UID from the verified Firebase token is used as the primary identifier.
    """
    firebase_uid = current_user.get("uid")
    if not firebase_uid:
        raise HTTPException(status_code=400, detail="UID not found in token")

    db_user = user_crud.get_user(db, user_id=firebase_uid)
    if db_user:
        raise HTTPException(status_code=400, detail="User profile already exists")

    return user_crud.create_user(db=db, user=user_in, user_id=firebase_uid)

@router.get("/me", response_model=ProfileOut, summary="Get own user profile")
def read_user_me(
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    """
    Fetches the profile of the currently authenticated user.
    """
    firebase_uid = current_user.get("uid")
    db_user = user_crud.get_user(db, user_id=firebase_uid)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User profile not found")
    return db_user