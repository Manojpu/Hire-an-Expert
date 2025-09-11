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
    is_verified = Column(Boolean, default=False)
    
    # Relationship
    user = relationship("User", back_populates="expert_profiles")
    
    def __repr__(self):
        return f"<ExpertProfile(id={self.id}, user_id={self.user_id}, specialization={self.specialization})>"

class VerificationDocument(Base):
    __tablename__ = "verification_documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    expert_profile_id = Column(UUID(as_uuid=True), ForeignKey("expert_profiles.id", ondelete="CASCADE"), nullable=False)
    document_type = Column(Enum(DocumentType), nullable=False)
    document_url = Column(String, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationship
    expert_profile = relationship("ExpertProfile", backref="verification_documents")
    
    def __repr__(self):
        return f"<VerificationDocument(id={self.id}, expert_profile_id={self.expert_profile_id}, document_type={self.document_type})>"