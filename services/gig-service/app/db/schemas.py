from datetime import datetime
from typing import List, Optional
import uuid
from pydantic import BaseModel, Field, UUID4
import enum
from fastapi import Form
from app.db.models import GigStatus


class UserRole(str, enum.Enum):
    CLIENT = "client"
    EXPERT = "expert"
    ADMIN = "admin"

class UserDTO(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    firebase_uid: str
    name: str
    email: str
    phone: Optional[str] = None
    role: UserRole = UserRole.CLIENT
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None
    location: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    is_expert: bool = True

    class Config:
        from_attributes = True
        json_encoders = {
            uuid.UUID: str
        }

class CategoryBase(BaseModel):
    """Base schema for category data."""

    name: str = Field(..., min_length=3, max_length=100)
    slug: str = Field(..., min_length=3, max_length=100)


class CategoryCreate(CategoryBase):
    """Schema used for creating a new category."""

    pass


class Category(CategoryBase):
    """Schema for representing a category, including its database ID."""

    id: UUID4
    created_at: datetime

    class Config:
        from_attributes = True


class GigBase(BaseModel):
    service_description: Optional[str] = Field(None, max_length=5000)
    hourly_rate: float = Field(..., gt=0, description="Price in LKR")
    expertise_areas: List[str] = []
    experience_years: Optional[int] = Field(None, ge=0)
    work_experience: Optional[str] = Field(None, max_length=2000)
    thumbnail_url: Optional[str] = Field(None, max_length=2000)


class GigCreate(GigBase):
    category_id: str = Field(..., description="The ID or slug of the category")
    

# Helper dependency to parse form fields into GigCreate
def gig_create_form(
    service_description: Optional[str] = Form(None),
    hourly_rate: float = Form(...),
    expertise_areas: Optional[str] = Form(None),   # You’ll need to handle conversion
    experience_years: Optional[int] = Form(None),
    work_experience: Optional[str] = Form(None),
    thumbnail_url: Optional[str] = Form(None),
    category_id: str = Form(...)
) -> GigCreate:
    # Convert comma-separated string into list for expertise_areas
    expertise_list = expertise_areas.split(",") if expertise_areas else []
    return GigCreate(
        service_description=service_description,
        hourly_rate=hourly_rate,
        expertise_areas=expertise_list,
        experience_years=experience_years,
        work_experience=work_experience,
        thumbnail_url=thumbnail_url,
        category_id=category_id
    )

class GigUpdate(BaseModel):
    """Schema for updating an existing gig. All fields are optional."""

    category_id: Optional[str] = None
    service_description: Optional[str] = Field(None, max_length=5000)
    hourly_rate: Optional[float] = Field(None, gt=0)
    availability_preferences: Optional[str] = Field(None, max_length=1000)
    expertise_areas: Optional[List[str]] = None
    experience_years: Optional[int] = Field(None, ge=0)
    work_experience: Optional[str] = Field(None, max_length=2000)  # New field for work experience details


class Gig(GigBase):
    """
    The full schema for a Gig, used in API responses.
    Includes all database fields and nested category information.
    """

    id: str
    expert_id: str
    category: Category  # Nest the full category object for rich responses
    status: GigStatus
    currency: str
    response_time: str
    created_at: datetime
    updated_at: Optional[datetime]
    approved_at: Optional[datetime]

    class Config:
        from_attributes = True


class GigResponse(Gig):
    """Response model for a gig, identical to Gig for now."""
    pass


class GigListResponse(BaseModel):
    """Response model for a paginated list of gigs."""

    gigs: List[Gig]
    total: int
    page: int
    size: int
    pages: int  # Total number of pages


class GigPrivateResponse(Gig):
    """
    Response model for expert's own gig with additional private data.
    Extends the Gig model with any private fields the expert should see.
    """
    pass


class GigDetailResponse(Gig):
    """
    Response model for detailed public gig view.
    Extends the Gig model with any additional presentation data.
    """
    pass


class GigFilters(BaseModel):
    """Schema for filtering and searching gigs."""

    category_id: Optional[str] = None  # Can be either UUID or slug
    min_rate: Optional[float] = Field(None, ge=0)
    max_rate: Optional[float] = Field(None, ge=0)
    min_experience_years: Optional[int] = Field(None, ge=0)
    search_query: Optional[str] = Field(None, max_length=100)
    status: Optional[GigStatus] = Field(default=GigStatus.ACTIVE)


class GigStatusUpdate(BaseModel):
    """Schema for updating a gig's status by admins."""

    status: GigStatus
    rejection_reason: Optional[str] = Field(None, max_length=1000)


class DailyGigCount(BaseModel):
    """Schema for daily gig count analytics."""
    date: str
    count: int


class GigAnalyticsResponse(BaseModel):
    """Response schema for gig analytics."""
    data: List[DailyGigCount]
    total_count: int


class GigAnalyticsRequest(BaseModel):
    """Request schema for gig analytics filters."""
    start_date: Optional[str] = None
    end_date: Optional[str] = None