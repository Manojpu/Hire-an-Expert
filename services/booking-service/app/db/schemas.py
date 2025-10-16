from pydantic import BaseModel
from datetime import datetime
from app.db.models import BookingStatus
from typing import Optional
from decimal import Decimal

# Nested schemas for related data
class UserInfo(BaseModel):
    id: int
    name: Optional[str] = None
    email: Optional[str] = None

    class Config:
        from_attributes = True

class GigInfo(BaseModel):
    id: str  # Changed to string to handle UUID
    title: Optional[str] = None
    hourly_rate: Optional[Decimal] = None

    class Config:
        from_attributes = True

# Base properties shared by all Booking schemas
class BookingBase(BaseModel):
    gig_id: str  # Changed to string to handle UUID

class BookingCreate(BookingBase):
    """Schema for creating a new booking. user_id will be provided by the auth system."""
    scheduled_time: Optional[datetime] = None
    duration: Optional[int] = 30  # Duration in minutes
    service: Optional[str] = 'consultation'
    type: Optional[str] = 'standard'
    notes: Optional[str] = None

class BookingResponse(BookingBase):
    id: int
    user_id: int
    status: str
    scheduled_time: Optional[datetime] = None
    duration: Optional[int] = None
    service: Optional[str] = None
    type: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class BookingWithDetails(BookingResponse):
    """Extended booking response with user and gig details"""
    user: Optional[UserInfo] = None
    gig: Optional[GigInfo] = None

    class Config:
        from_attributes = True

class BookingUpdate(BaseModel):
    status: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    duration: Optional[int] = None
    service: Optional[str] = None
    type: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True