from sqlalchemy import Column, Integer, DateTime, func, ForeignKey, Enum, String
from sqlalchemy.ext.declarative import declarative_base
import enum

Base = declarative_base()

class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# Placeholder tables for foreign key references
class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    # Add any fields you need for testing/development

class Gig(Base):
    __tablename__ = 'gigs'
    id = Column(Integer, primary_key=True)
    # Add any fields you need for testing/development

class Booking(Base):
    __tablename__ = 'bookings'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    gig_id = Column(Integer, ForeignKey('gigs.id'), nullable=False)
    # Status can be 'pending', 'confirmed', 'completed', 'cancelled'
    status = Column(Enum(BookingStatus), nullable=False, default=BookingStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    def __repr__(self):
        return f"<Booking(id={self.id}, user_id={self.user_id}, gig_id={self.gig_id}, status='{self.status}')>"