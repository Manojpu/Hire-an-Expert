from sqlalchemy import TIMESTAMP, Boolean, Column, Integer, String, Text, DateTime, Enum, ForeignKey, UniqueConstraint
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
    is_expert = Column(Boolean, default=True)
    
    # Relationship
    expert_profiles = relationship("ExpertProfile", back_populates="user")
    preferences = relationship("Preference", back_populates="user", cascade="all, delete-orphan")
    
    
    def __repr__(self):
        return f"<User(id={self.id}, firebase_uid={self.firebase_uid}, name={self.name}, role={self.role})>"


class ExpertProfile(Base):
    __tablename__ = "expert_profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    specialization = Column(String(100), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
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

