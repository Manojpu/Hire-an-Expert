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

class Booking(Base):
    __tablename__ = 'bookings'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)  # No foreign key as managed by user-service
    gig_id = Column(UUID(as_uuid=True), nullable=False)   # No foreign key as managed by gig-service
    # Status can be 'pending', 'confirmed', 'completed', 'cancelled'
    status = Column(Enum(BookingStatus), nullable=False, default=BookingStatus.PENDING)
    scheduled_time = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    meeting_link = Column(String, nullable=True)  # Agora meeting link/channel name
    
    def __repr__(self):
        return f"<Booking(id={self.id}, user_id={self.user_id}, gig_id={self.gig_id}, status='{self.status}')>"