from datetime import datetime
from typing import List, Optional
import uuid
from pydantic import BaseModel, Field, UUID4
import enum
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
    """Base schema with common fields for a gig."""

    service_description: Optional[str] = Field(None, max_length=5000)
    hourly_rate: float = Field(..., gt=0, description="Price in LKR")
    availability_preferences: Optional[str] = Field(None, max_length=1000)
    expertise_areas: List[str] = Field(default=[])
    experience_years: Optional[int] = Field(None, ge=0)
    work_experience: Optional[str] = Field(None, max_length=2000)  # New field for work experience details


class GigCreate(GigBase):
    """Schema for creating a new gig. expert_id will be derived from the auth token."""

    category_id: UUID4 = Field(..., description="The ID of the category this gig belongs to")


class GigUpdate(BaseModel):
    """Schema for updating an existing gig. All fields are optional."""

    category_id: Optional[UUID4] = None
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

    category_id: Optional[UUID4] = None
    min_rate: Optional[float] = Field(None, ge=0)
    max_rate: Optional[float] = Field(None, ge=0)
    min_experience_years: Optional[int] = Field(None, ge=0)
    search_query: Optional[str] = Field(None, max_length=100)
    status: Optional[GigStatus] = Field(default=GigStatus.ACTIVE)


class GigStatusUpdate(BaseModel):
    """Schema for updating a gig's status by admins."""

    status: GigStatus
    rejection_reason: Optional[str] = Field(None, max_length=1000)