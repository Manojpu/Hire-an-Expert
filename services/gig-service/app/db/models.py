from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, String, Float, DateTime, func, Text, Enum, ForeignKey
import uuid
import enum

Base = declarative_base()

class GigStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    HOLD = "hold"
    REJECTED = "rejected"

class Category(Base):
    """
    Stores the main service categories for organizing gigs.
    [cite_start]This aligns with the four main categories specified in your SRS[cite: 94].
    """
    __tablename__ = "categories"

    id = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(
        String(100), unique=True, nullable=False
    )  # URL-friendly name, e.g., "automobile-advice"

    created_at = Column(DateTime, server_default=func.now())
    gigs = relationship("Gig", back_populates="category")


    def __repr__(self):
        return f"<Category(id={self.id}, name='{self.name}')>"

class Certification(Base):
    """
    Stores certifications uploaded by experts.
    """
    __tablename__ = "certifications"

    id = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    gig_id = Column(String, index=True)  # Foreign key to Gig
    url = Column(String, nullable=False)  # URL to the stored certification document
    thumbnail_url = Column(String, nullable=True)  # URL to the thumbnail image
    uploaded_at = Column(DateTime, server_default=func.now())

    def __repr__(self):
        return f"<Certification(id={self.id}, gig_id='{self.gig_id}', url='{self.url}', thumbnail_url='{self.thumbnail_url}')>"

class Gig(Base):
    __tablename__ = 'gigs'
    
    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    expert_id = Column(String, index=True)  # Firebase UID from User Service
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False)  # Foreign key to Category
    service_description = Column(Text)
    hourly_rate = Column(Float, nullable=False)
    currency = Column(String, default='LKR')
    availability_preferences = Column(Text)
    response_time = Column(String, default='< 24 hours')
    thumbnail_url = Column(String, nullable=True)
    
    # Qualifications (from ApplyExpert step 2)
    expertise_areas = Column(ARRAY(String))  # List of expertise areas
    experience_years = Column(Integer)
    work_experience = Column(Text)  # New field for work experience details
    certification = Column(ARRAY(String))  # List of certification URLs
    
    # System fields
    status = Column(Enum(GigStatus, name="gigstatus"), default=GigStatus.PENDING)

    # Relationships
    category = relationship("Category", back_populates="gigs")
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    approved_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<Gig(id={self.id}, expert_id={self.expert_id}, service_description='{self.service_description}', hourly_rate={self.hourly_rate})>"