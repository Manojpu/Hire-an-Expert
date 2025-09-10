from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict
from datetime import datetime
import uuid
from models import UserRole


# Base schemas
class ExpertProfileIn(BaseModel):
    specialization: str

class ProvisionIn(BaseModel):
    firebase_uid: str
    email: str
    full_name: str
    is_expert: Optional[bool] = True
    expert_profiles: Optional[List[ExpertProfileIn]] = []

class ExpertProfileOut(BaseModel):
    specialization: str

    class Config:
        orm_mode = True

class UserOut(BaseModel):
    id: uuid.UUID
    firebase_uid: str
    email: str
    name: str
    is_expert: bool
    expert_profiles: List[ExpertProfileOut] = []

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    firebase_uid: str
    email: str
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = UserRole.CLIENT
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None

class UserResponse(BaseModel):
    id: uuid.UUID
    firebase_uid: str
    name: Optional[str]
    email: str
    phone: Optional[str]
    role: UserRole
    bio: Optional[str]
    profile_image_url: Optional[str]
    is_expert: bool
    created_at: datetime
    updated_at: datetime
    expert_profiles: List[ExpertProfileOut] = []

    class Config:
        from_attributes = True
        orm_mode = True
        
class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    role: UserRole = UserRole.CLIENT
    bio: Optional[str] = Field(None, max_length=1000)
    profile_image_url: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    bio: Optional[str] = Field(None, max_length=1000)
    profile_image_url: Optional[str] = None



# Preference schemas
class PreferenceBase(BaseModel):
    key: str = Field(..., min_length=1, max_length=100)
    value: str = Field(..., min_length=1, max_length=500)


class PreferenceCreate(PreferenceBase):
    pass


class PreferenceUpdate(BaseModel):
    value: str = Field(..., min_length=1, max_length=500)


class PreferenceResponse(PreferenceBase):
    id: uuid.UUID
    user_id: uuid.UUID
    
    class Config:
        from_attributes = True


# User with preferences
class UserWithPreferences(UserResponse):
    preferences: List[PreferenceResponse] = []


# Bulk preference operations
class PreferenceBulkCreate(BaseModel):
    preferences: List[PreferenceCreate]


class PreferenceBulkResponse(BaseModel):
    created: List[PreferenceResponse]
    updated: List[PreferenceResponse]
    errors: List[str] = []


# Error responses
class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None


class ValidationErrorResponse(BaseModel):
    detail: List[Dict[str, str]]


# Success responses
class SuccessResponse(BaseModel):
    message: str
    data: Optional[Dict] = None


# Pagination
class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    size: int = Field(10, ge=1, le=100)


class PaginatedResponse(BaseModel):
    items: List[UserResponse]
    total: int
    page: int
    size: int
    pages: int 