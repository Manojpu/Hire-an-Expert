from sqlalchemy.orm import Session
import json
from ..models import profile as models
from ..schemas import profile as schemas

def get_profile(db: Session, user_id: str):
    """Get a profile by Firebase UID"""
    try:
        return db.query(models.Profile).filter(models.Profile.id == user_id).first()
    except Exception as e:
        print(f"Error fetching profile by id {user_id}: {e}")
        return None
    
def create_profile(db: Session, profile: schemas.ProfileCreate):
    """Create a new user profile"""
    # Convert dict to JSON string for storage if provided
    social_links_json = None
    if profile.social_links:
        social_links_json = json.dumps(profile.social_links)
    
    db_profile = models.Profile(
        id=profile.id,  # Use the provided Firebase UID
        display_name=profile.display_name,
        bio=profile.bio,
        is_expert=profile.is_expert,
        phone_number=profile.phone_number,
        profile_pic=profile.profile_pic,
        location=profile.location,
        social_links=social_links_json
    )
    
    try:
        db.add(db_profile)
        db.commit()
        db.refresh(db_profile)
        return db_profile
    except Exception as e:
        print(f"Error creating profile: {e}")
        db.rollback()
        raise

def update_profile(db: Session, user_id: str, profile_data: schemas.ProfileUpdate):
    """Update an existing profile"""
    db_profile = get_profile(db, user_id)
    if db_profile is None:
        return None
    
    update_data = profile_data.dict(exclude_unset=True)
    
    # Convert social_links dict to JSON string if it exists
    if "social_links" in update_data and update_data["social_links"]:
        update_data["social_links"] = json.dumps(update_data["social_links"])
    
    for key, value in update_data.items():
        setattr(db_profile, key, value)
    
    try:
        db.commit()
        db.refresh(db_profile)
        return db_profile
    except Exception as e:
        print(f"Error updating profile: {e}")
        db.rollback()
        raise

def delete_profile(db: Session, user_id: str):
    """Delete a profile by Firebase UID"""
    db_profile = get_profile(db, user_id)
    if db_profile is None:
        return None
    
    try:
        db.delete(db_profile)
        db.commit()
        return db_profile
    except Exception as e:
        print(f"Error deleting profile: {e}")
        db.rollback()
        raise