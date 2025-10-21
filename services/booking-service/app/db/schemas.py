from pydantic import BaseModel
from datetime import datetime
from app.db.models import BookingStatus
from typing import Optional
import uuid

# Base properties shared by all Booking schemas
class BookingBase(BaseModel):
    gig_id: uuid.UUID
    scheduled_time: datetime

class BookingCreate(BookingBase):
    """Schema for creating a new booking. user_id will be provided by the auth system."""
    pass

class BookingResponse(BookingBase):
    id: uuid.UUID
    user_id: uuid.UUID
    status: str  # Will serialize the enum value (UPPERCASE in database)
    created_at: datetime
    meeting_link: Optional[str] = None

    class Config:
        from_attributes = True
        # Custom serializer to handle enum serialization
        json_encoders = {
            BookingStatus: lambda v: v.value if isinstance(v, BookingStatus) else str(v)
        }
        
class GigDetails(BaseModel):
    id: str
    service_description: str
    thumbnail_url: Optional[str] = None
    hourly_rate: float
    currency: str
    
class BookingResponseWithGigDetails(BookingResponse):
    gig_details: Optional[GigDetails] = None
class BookingUpdate(BaseModel):
    status: str | None = None
    scheduled_time: datetime | None = None
    meeting_link: str | None = None

    class Config:
        from_attributes = True