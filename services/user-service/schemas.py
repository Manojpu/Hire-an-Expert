from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import List, Optional, Dict, Any

# Base User Schemas
class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False
    role: str = "client"
    profile_picture_url: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    profile_picture_url: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Expert Profile Schemas
class ExpertProfileBase(BaseModel):
    headline: Optional[str] = None
    bio: Optional[str] = None
    categories: List[str] = []
    skills: List[str] = []
    hourly_rate: Optional[float] = None
    experience_years: int = 0
    education: Optional[str] = None
    certifications: List[str] = []
    languages: List[str] = []
    location: Optional[str] = None
    is_available: bool = True

class ExpertProfileCreate(ExpertProfileBase):
    pass

class ExpertProfileUpdate(BaseModel):
    headline: Optional[str] = None
    bio: Optional[str] = None
    categories: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    hourly_rate: Optional[float] = None
    experience_years: Optional[int] = None
    education: Optional[str] = None
    certifications: Optional[List[str]] = None
    languages: Optional[List[str]] = None
    location: Optional[str] = None
    is_available: Optional[bool] = None

class ExpertProfileResponse(ExpertProfileBase):
    id: int
    user_id: int
    rating: float = 0.0
    total_reviews: int = 0
    completed_sessions: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
    user: UserResponse

    class Config:
        from_attributes = True

# Expert Service Schemas
class ExpertServiceBase(BaseModel):
    name: str
    description: Optional[str] = None
    price_per_hour: float
    duration_minutes: int = 60
    is_active: bool = True

class ExpertServiceCreate(ExpertServiceBase):
    pass

class ExpertServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_per_hour: Optional[float] = None
    duration_minutes: Optional[int] = None
    is_active: Optional[bool] = None

class ExpertServiceResponse(ExpertServiceBase):
    id: int
    expert_profile_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Client Profile Schemas
class ClientProfileBase(BaseModel):
    preferences: Dict[str, Any] = {}

class ClientProfileCreate(ClientProfileBase):
    pass

class ClientProfileUpdate(BaseModel):
    preferences: Optional[Dict[str, Any]] = None

class ClientProfileResponse(ClientProfileBase):
    id: int
    user_id: int
    total_bookings: int = 0
    total_spent: float = 0.0
    created_at: datetime
    updated_at: Optional[datetime] = None
    user: UserResponse

    class Config:
        from_attributes = True

# Authentication Schemas
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[str] = None
    roles: List[str] = []

# Search and Filter Schemas
class ExpertSearchParams(BaseModel):
    categories: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    min_rating: Optional[float] = None
    max_hourly_rate: Optional[float] = None
    location: Optional[str] = None
    is_available: Optional[bool] = None
    limit: int = 20
    offset: int = 0

class ExpertSearchResponse(BaseModel):
    experts: List[ExpertProfileResponse]
    total: int
    limit: int
    offset: int

# Category and Skill Schemas
class CategoryResponse(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None

class SkillResponse(BaseModel):
    name: str
    category: str
    description: Optional[str] = None