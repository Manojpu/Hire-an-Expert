from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict
from datetime import datetime
import uuid
from uuid import UUID as UUID4
from models import UserRole,DocumentType
from pydantic import ConfigDict


# Base schemas
class ExpertProfileIn(BaseModel):
    specialization: str

class ProvisionIn(BaseModel):
    firebase_uid: str
    email: str
    name: str  # Changed from full_name to name
    is_expert: Optional[bool] = True
    expert_profiles: Optional[List[ExpertProfileIn]] = []

class ExpertProfileOut(BaseModel):
    specialization: str

    class Config:
        from_attributes = True

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
    location: Optional[str] = None

class UserResponse(BaseModel):
    id: uuid.UUID
    firebase_uid: str
    name: Optional[str]
    email: str
    phone: Optional[str]
    role: str  # or your UserRole enum
    bio: Optional[str]
    profile_image_url: Optional[str]
    location: Optional[str]
    is_expert: bool
    created_at: datetime
    updated_at: datetime
    # expert_profiles: List[ExpertProfileOut] = []

    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    role: UserRole = UserRole.CLIENT
    bio: Optional[str] = Field(None, max_length=1000)
    profile_image_url: Optional[str] = None
    location: Optional[str] = Field(None, max_length=200)


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    bio: Optional[str] = Field(None, max_length=1000)
    profile_image_url: Optional[str] = None
    location: Optional[str] = Field(None, max_length=200)



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
    
# Verification Document schemas
class VerificationDocumentBase(BaseModel):
    document_type: DocumentType
    document_url: str

class VerificationDocumentCreate(VerificationDocumentBase):
    pass

class VerificationDocumentResponse(VerificationDocumentBase):
    id: uuid.UUID
    user_id: uuid.UUID
    uploaded_at: datetime
    
    class Config:
        from_attributes = True

# Expert verification schemas
class ExpertVerificationUpdate(BaseModel):
    is_verified: bool
    
class ExpertVerificationResponse(BaseModel):
    user_id: uuid.UUID
    expert_profile_id: uuid.UUID
    specialization: str
    is_verified: bool
    
    class Config:
        from_attributes = True

# For Time Managemnt
class AvailabilityRuleBase(BaseModel):
    day_of_week: int
    start_time_utc: str
    end_time_utc: str

class DateOverride(BaseModel):
    unavailable_date: str  # "YYYY-MM-DD"

class DateOverrideCreate(DateOverride):
    pass

class AvailabilityRuleCreate(AvailabilityRuleBase):
    pass

class CreateAvailabilitySchedules(BaseModel):
    availabilityRules: List[AvailabilityRuleCreate]
    dateOverrides: List[DateOverrideCreate] = []

class AvailabilityRule(AvailabilityRuleBase):
    id: UUID4
    
    class Config:
        from_attributes = True

class AvailabilitySlotBase(BaseModel):
    date: str  # "YYYY-MM-DD"
    start_time: str  # "HH:MM"
    end_time: str  # "HH:MM"

class AvailabilitySlotCreate(AvailabilitySlotBase):
    pass

class AvailabilitySlotResponse(AvailabilitySlotBase):
    id: UUID4
    user_id: UUID4
    is_booked: bool
    booking_id: Optional[UUID4] = None
    
    class Config:
        from_attributes = True