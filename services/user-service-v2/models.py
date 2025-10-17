from sqlalchemy import TIMESTAMP, Boolean, Column, Integer, String, Text, DateTime, Enum, ForeignKey, UniqueConstraint, Date, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
import uuid
from database import Base


class UserRole(str, enum.Enum):
    CLIENT = "client"
    EXPERT = "expert"
    ADMIN = "admin"

class DocumentType(str, enum.Enum):
    ID_PROOF = "ID_PROOF"
    PROFESSIONAL_LICENSE = "PROFESSIONAL_LICENSE"
    OTHER = "OTHER"


class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firebase_uid = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True)
    phone = Column(String)
    role = Column(Enum(UserRole), default=UserRole.CLIENT, nullable=False)
    bio = Column(Text)
    profile_image_url = Column(String)
    location = Column(String)  # User's geographical location (e.g., "New York, USA")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    is_expert = Column(Boolean, default=False)
    
    # Relationship
    expert_profiles = relationship("ExpertProfile", back_populates="user")
    preferences = relationship("Preference", back_populates="user", cascade="all, delete-orphan")
    verification_documents = relationship("VerificationDocument", back_populates="user", cascade="all, delete-orphan")
    
    
    def __repr__(self):
        return f"<User(id={self.id}, firebase_uid={self.firebase_uid}, name={self.name}, role={self.role})>"


class ExpertProfile(Base):
    __tablename__ = "expert_profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    specialization = Column(String(100), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    is_verified = Column(Boolean, default=False)
    
    # Relationship
    user = relationship("User", back_populates="expert_profiles")
    
    def __repr__(self):
        return f"<ExpertProfile(id={self.id}, user_id={self.user_id}, specialization={self.specialization})>"


class Preference(Base):
    __tablename__ = "preferences"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    key = Column(String(100), nullable=False)  # e.g., "email_notifications", "sms_notifications"
    value = Column(String(500), nullable=False)  # e.g., "true", "false", or complex JSON values
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Composite unique constraint to prevent duplicate keys per user
    __table_args__ = (UniqueConstraint('user_id', 'key', name='unique_user_preference'),)
    
    # Relationship
    user = relationship("User", back_populates="preferences")
    
    def __repr__(self):
        return f"<Preference(id={self.id}, user_id={self.user_id}, key={self.key}, value={self.value})>"

class VerificationDocument(Base):
    __tablename__ = "verification_documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    document_type = Column(Enum(DocumentType), nullable=False)
    document_url = Column(String, nullable=False)  # URL to the stored document (e.g., in S3)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationship back reference
    user = relationship("User", back_populates="verification_documents")

    def __repr__(self):
        return f"<VerificationDocument(id={self.id}, user_id={self.user_id}, document_type={self.document_type})>"
    
class AvailabilityRule(Base):
    """Stores the recurring weekly availability for an expert."""
    __tablename__ = "availability_rules"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Day of the week: 0=Monday, 1=Tuesday, ..., 6=Sunday
    day_of_week = Column(Integer, nullable=False) 
    
    # Times are stored as strings in "HH:MM" format in UTC
    start_time_utc = Column(String(5), nullable=False) # e.g., "09:00"
    end_time_utc = Column(String(5), nullable=False)   # e.g., "17:00"
    
    user = relationship("User")

class DateOverride(Base):
    """Stores exceptions to the rules, like holidays or vacations."""
    __tablename__ = "date_overrides"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    unavailable_date = Column(Date, nullable=False)
    
    user = relationship("User")
    
class AvailabilitySlot(Base):
    """Stores specific time slots when an expert is available for booking."""
    __tablename__ = "availability_slots"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_booked = Column(Boolean, default=False)
    booking_id = Column(UUID(as_uuid=True), nullable=True)  # Optional reference to a booking
    
    user = relationship("User")
    
    __table_args__ = (
        # Ensure we don't create overlapping slots
        UniqueConstraint('user_id', 'date', 'start_time', 'end_time', name='unique_slot'),
    )