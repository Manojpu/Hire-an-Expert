from pydantic import BaseModel
from typing import Optional

# --- Base Schema ---
# Contains shared attributes that are common across different operations.
class ProfileBase(BaseModel):
    id: Optional[str] = None  # Firebase UID, optional for creation
    display_name: str
    bio: Optional[str] = None
    is_expert: bool = False
    phone_number: Optional[str] = None
    profile_pic: Optional[str] = None
    location: Optional[str] = None
    social_links: Optional[dict] = None  # This can be a dict with keys like 'linkedin', 'twitter', etc.



# --- Create Schema ---
# Used when creating a new profile. Inherits from ProfileBase.
# No extra fields are needed for creation in this case.
class ProfileCreate(ProfileBase):
    pass

# --- Output Schema (Read Schema) ---
# Used when returning profile data from the API.
# It includes the 'id' (Firebase UID) and is configured for ORM mode
# to work smoothly with the SQLAlchemy model.
class ProfileOut(ProfileBase):
    id: str

    class Config:
       #converts DB object to JSON format for working SQL alchemy models
        orm_mode = True
# --- Update Schema ---
# Used when updating an existing profile.
# It inherits from ProfileBase and allows all fields to be optional.
class ProfileUpdate(ProfileBase):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    is_expert: Optional[bool] = None
    phone_number: Optional[str] = None
    profile_picture: Optional[str] = None
    location: Optional[str] = None
    social_links: Optional[dict] = None  # This can be a dict with keys like 'linkedin', 'twitter', etc.