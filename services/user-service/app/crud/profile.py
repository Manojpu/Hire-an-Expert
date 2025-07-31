from sqlalchemy.orm import Session

from ..models import profile as models
from ..schemas import profile as schemas

def get_profile(db: Session, profile_id: str):
    try:
        return db.query(models.Profile).filter(models.Profile.id == profile_id).first()
    except Exception as e:
        print(f"Error fetching profile by id {profile_id}: {e}")
        return None
    
def create_profile(db: Session, profile: schemas.ProfileCreate):
    db_profile = models.Profile(
        display_name=profile.display_name,
        bio=profile.bio,
        is_expert=profile.is_expert,
        phone_number=profile.phone_number,
        profile_pic=profile.profile_pic,
        location=profile.location,
        social_links=profile.social_links
    )
    try:
        db.add(db_profile)
        db.commit()
        db.refresh(db_profile)
        return db_profile
    except Exception as e:
        print(f"Error creating profile: {e}")
        db.rollback()
        return None
