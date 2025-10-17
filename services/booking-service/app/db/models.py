from sqlalchemy import Column, Integer, DateTime, func, ForeignKey, Enum, String, Text, Numeric
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum
import uuid

Base = declarative_base()

class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# Placeholder tables for foreign key references
class User(Base):
    __tablename__ = 'users'
    __table_args__ = {'schema': 'booking_db'}
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)

class Gig(Base):
    __tablename__ = 'gigs'
    __table_args__ = {'schema': 'booking_db'}
    id = Column(String(36), primary_key=True)  # Changed to handle UUIDs
    title = Column(String(255), nullable=True)
    hourly_rate = Column(Numeric(10, 2), nullable=True)

class Booking(Base):
    __tablename__ = 'bookings'
    __table_args__ = {'schema': 'booking_db'}
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('booking_db.users.id'), nullable=False)
    gig_id = Column(String(36), ForeignKey('booking_db.gigs.id'), nullable=False)  # Changed to handle UUID gig IDs
    status = Column(Enum(BookingStatus), nullable=False, default=BookingStatus.PENDING)
    scheduled_time = Column(DateTime(timezone=True), nullable=True)
    duration = Column(Integer, nullable=True, default=30)  # Duration in minutes
    amount = Column(Numeric(10, 2), nullable=True)  # Total amount/subtotal for the booking
    service = Column(String(100), nullable=True, default='consultation')
    type = Column(String(100), nullable=True, default='standard')
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<Booking(id={self.id}, user_id={self.user_id}, gig_id={self.gig_id}, status='{self.status}')>"