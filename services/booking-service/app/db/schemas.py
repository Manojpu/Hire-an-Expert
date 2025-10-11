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
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
        
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

    class Config:
        from_attributes = True