from sqlalchemy import Column, Integer, DateTime, func, ForeignKey, Enum, String
from sqlalchemy.ext.declarative import declarative_base
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
    id = Column(UUID(as_uuid=True), primary_key=True)
    # Add any fields you need for testing/development

class Gig(Base):
    __tablename__ = 'gigs'
    id = Column(UUID(as_uuid=True), primary_key=True)
    # Add any fields you need for testing/development

class Booking(Base):
    __tablename__ = 'bookings'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    gig_id = Column(UUID(as_uuid=True), ForeignKey('gigs.id'), nullable=False)
    # Status can be 'pending', 'confirmed', 'completed', 'cancelled'
    status = Column(Enum(BookingStatus), nullable=False, default=BookingStatus.PENDING)
    scheduled_time = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    def __repr__(self):
        return f"<Booking(id={self.id}, user_id={self.user_id}, gig_id={self.gig_id}, status='{self.status}')>"