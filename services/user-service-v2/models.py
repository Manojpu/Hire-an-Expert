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
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    is_expert = Column(Boolean, default=True)
    
    # Relationship
    expert_profiles = relationship("ExpertProfile", back_populates="user")
    
    
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

