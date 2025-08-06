from pydantic import BaseModel
from datetime import datetime
from app.db.models import BookingStatus
from typing import Optional

# Base properties shared by all Booking schemas
class BookingBase(BaseModel):
    gig_id: int

class BookingCreate(BookingBase):
    """Schema for creating a new booking. user_id will be provided by the auth system."""
    pass

class BookingResponse(BookingBase):
    id: int
    user_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
class BookingUpdate(BaseModel):
    status: str | None = None
    scheduled_time: datetime | None = None

    class Config:
        from_attributes = True