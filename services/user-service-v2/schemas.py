from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict
from datetime import datetime
import uuid
from models import UserRole


# Base schemas

class ProvisionIn(BaseModel):
    firebase_uid: str
    email: Optional[str] = None
    full_name: Optional[str] = None

class UserOut(BaseModel):
    id: int
    firebase_uid: str
    email: Optional[str]
    full_name: Optional[str]
    role: str
    class Config:
        from_attributes = True
        
class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    role: UserRole = UserRole.CLIENT
    bio: Optional[str] = Field(None, max_length=1000)
    profile_image_url: Optional[str] = None


class UserCreate(UserBase):
    firebase_uid: str = Field(..., min_length=1)


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    bio: Optional[str] = Field(None, max_length=1000)
    profile_image_url: Optional[str] = None


class UserResponse(UserBase):
    id: uuid.UUID
    firebase_uid: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


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