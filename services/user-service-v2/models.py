from sqlalchemy import Column, String, Text, DateTime, Enum, ForeignKey, UniqueConstraint
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
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationship
    preferences = relationship("Preference", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, firebase_uid={self.firebase_uid}, name={self.name}, role={self.role})>"


class Preference(Base):
    __tablename__ = "preferences"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    key = Column(String, nullable=False)
    value = Column(String, nullable=False)
    
    # Relationship
    user = relationship("User", back_populates="preferences")
    
    # Unique constraint to ensure one preference per key per user
    __table_args__ = (UniqueConstraint('user_id', 'key', name='uq_user_preference_key'),)
    
    def __repr__(self):
        return f"<Preference(id={self.id}, user_id={self.user_id}, key={self.key}, value={self.value})>" 