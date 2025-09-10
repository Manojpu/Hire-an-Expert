from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum

class GigStatusEnum(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved" 
    REJECTED = "rejected"
    ACTIVE = "active"
    INACTIVE = "inactive"

class ExpertCategoryEnum(str, Enum):
    AUTOMOBILE_ADVICE = "automobile-advice"
    ELECTRONIC_DEVICE_ADVICE = "electronic-device-advice"
    HOME_APPLIANCE_GUIDANCE = "home-appliance-guidance"
    EDUCATION_CAREER_GUIDANCE = "education-career-guidance"

# Schema for creating a new gig (matches ApplyExpert form)
class GigCreate(BaseModel):
    # Basic Information (Step 0)
    name: str = Field(..., min_length=1, max_length=100)
    title: str = Field(..., min_length=1, max_length=200)  # Professional headline
    bio: Optional[str] = Field(None, max_length=2000)
    profile_image_url: Optional[str] = None
    banner_image_url: Optional[str] = None
    languages: List[str] = Field(default=['English'])
    
    # Expertise & Services (Step 1)
    category: ExpertCategoryEnum
    service_description: Optional[str] = Field(None, max_length=2000)
    hourly_rate: float = Field(..., gt=0)
    currency: str = Field(default='LKR')
    availability_preferences: Optional[str] = None
    
    # Qualifications (Step 2)
    education: Optional[str] = Field(None, max_length=2000)
    experience: Optional[str] = Field(None, max_length=2000)
    certifications: List[str] = Field(default=[])  # File URLs
    
    # Verification (Step 3)
    government_id_url: Optional[str] = None
    professional_license_url: Optional[str] = None
    references: Optional[str] = Field(None, max_length=1000)
    background_check_consent: bool = Field(default=False)

# Schema for updating a gig
class GigUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    bio: Optional[str] = Field(None, max_length=2000)
    profile_image_url: Optional[str] = None
    banner_image_url: Optional[str] = None
    languages: Optional[List[str]] = None
    category: Optional[ExpertCategoryEnum] = None
    service_description: Optional[str] = Field(None, max_length=2000)
    hourly_rate: Optional[float] = Field(None, gt=0)
    availability_preferences: Optional[str] = None
    education: Optional[str] = Field(None, max_length=2000)
    experience: Optional[str] = Field(None, max_length=2000)
    references: Optional[str] = Field(None, max_length=1000)

# Schema for gig status updates (admin/system use)
class GigStatusUpdate(BaseModel):
    status: GigStatusEnum
    admin_notes: Optional[str] = None

# Public gig response (for category/search pages)
class GigPublicResponse(BaseModel):
    id: str
    name: str
    title: str
    bio: Optional[str]
    profile_image_url: Optional[str]
    banner_image_url: Optional[str]
    category: ExpertCategoryEnum
    hourly_rate: float
    currency: str
    rating: float
    total_reviews: int
    total_consultations: int
    response_time: str
    languages: List[str]
    status: GigStatusEnum
    created_at: datetime

    class Config:
        from_attributes = True

# Detailed gig response (for expert profile page)
class GigDetailResponse(GigPublicResponse):
    expert_id: str
    service_description: Optional[str]
    availability_preferences: Optional[str]
    education: Optional[str]
    experience: Optional[str]
    is_verified: bool
    approved_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

# Schema for expert's own gig management
class GigPrivateResponse(GigDetailResponse):
    certifications: List[str]
    government_id_url: Optional[str]
    professional_license_url: Optional[str]
    references: Optional[str]
    background_check_consent: bool

    class Config:
        from_attributes = True

# Response for listing gigs with pagination
class GigListResponse(BaseModel):
    gigs: List[GigPublicResponse]
    total: int
    page: int
    size: int
    pages: int

# Search/filter parameters
class GigFilters(BaseModel):
    category: Optional[ExpertCategoryEnum] = None
    min_rate: Optional[float] = Field(None, ge=0)
    max_rate: Optional[float] = Field(None, ge=0)
    min_rating: Optional[float] = Field(None, ge=0, le=5)
    languages: Optional[List[str]] = None
    search_query: Optional[str] = Field(None, max_length=100)
    status: Optional[GigStatusEnum] = Field(default=GigStatusEnum.ACTIVE)