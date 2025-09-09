from sqlalchemy import Column, Integer, String, Float, DateTime, func, Text, Boolean, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid
import enum

Base = declarative_base()

class GigStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING = "pending" 
    APPROVED = "approved"
    REJECTED = "rejected"
    ACTIVE = "active"
    INACTIVE = "inactive"

class ExpertCategory(str, enum.Enum):
    AUTOMOBILE_ADVICE = "automobile-advice"
    ELECTRONIC_DEVICE_ADVICE = "electronic-device-advice"
    HOME_APPLIANCE_GUIDANCE = "home-appliance-guidance"
    EDUCATION_CAREER_GUIDANCE = "education-career-guidance"

class Gig(Base):
    __tablename__ = 'gigs'
    
    # Basic Information
    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    expert_id = Column(String, index=True)  # Firebase UID from User Service
    user_id = Column(String, index=True)    # Internal user ID
    
    # Basic Profile Info (from ApplyExpert step 0)
    name = Column(String, nullable=False)
    title = Column(String, nullable=False)  # Professional headline
    bio = Column(Text)
    profile_image_url = Column(String)
    banner_image_url = Column(String)
    languages = Column(ARRAY(String))  # List of languages
    
    # Expertise & Services (from ApplyExpert step 1)
    category = Column(Enum(ExpertCategory), nullable=False)
    service_description = Column(Text)
    hourly_rate = Column(Float, nullable=False)
    currency = Column(String, default='LKR')
    availability_preferences = Column(Text)
    response_time = Column(String, default='< 24 hours')
    
    # Qualifications (from ApplyExpert step 2)
    education = Column(Text)
    experience = Column(Text)
    certifications = Column(ARRAY(String))  # File URLs/paths
    
    # Verification (from ApplyExpert step 3)
    government_id_url = Column(String)
    professional_license_url = Column(String)
    references = Column(Text)
    background_check_consent = Column(Boolean, default=False)
    
    # System fields
    status = Column(Enum(GigStatus), default=GigStatus.DRAFT)
    is_verified = Column(Boolean, default=False)
    rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    total_consultations = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    approved_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<Gig(id={self.id}, expert_id={self.expert_id}, title='{self.title}', status={self.status})>"