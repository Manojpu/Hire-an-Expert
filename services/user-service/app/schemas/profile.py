from pydantic import BaseModel, Field
from typing import Optional, Dict
from datetime import datetime

# --- Base Schema ---
class ProfileBase(BaseModel):
    """Base profile schema with common fields"""
    display_name: str
    bio: Optional[str] = None
    is_expert: bool = False
    phone_number: Optional[str] = None
    profile_pic: Optional[str] = None
    location: Optional[str] = None
    social_links: Optional[Dict[str, str]] = None  # Dict with keys like 'linkedin', 'twitter', etc.

# --- Create Schema ---
class ProfileCreate(ProfileBase):
    """Schema for creating a new profile"""
    id: str  # Firebase UID is required for creation

# --- Output Schema ---
class ProfileOut(ProfileBase):
    """Schema for API responses"""
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
        from_attributes = True  # For newer Pydantic versions

# --- Update Schema ---
class ProfileUpdate(BaseModel):
    """Schema for updating an existing profile - all fields optional"""
    display_name: Optional[str] = None
    bio: Optional[str] = None
    is_expert: Optional[bool] = None
    phone_number: Optional[str] = None
    profile_pic: Optional[str] = None  # Fixed field name from profile_picture
    location: Optional[str] = None
    social_links: Optional[Dict[str, str]] = None


