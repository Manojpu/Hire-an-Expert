from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    phone_number = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    role = Column(String(20), default="client")  # 'client', 'expert', 'admin'
    profile_picture_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    expert_profile = relationship("ExpertProfile", back_populates="user", uselist=False)
    client_profile = relationship("ClientProfile", back_populates="user", uselist=False)

class ExpertProfile(Base):
    __tablename__ = "expert_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    headline = Column(String(200), nullable=True)
    bio = Column(Text, nullable=True)
    categories = Column(JSON, default=list)  # ["vehicles", "electronics", "home", etc.]
    skills = Column(JSON, default=list)  # ["car repair", "phone repair", etc.]
    hourly_rate = Column(Float, nullable=True)
    experience_years = Column(Integer, default=0)
    education = Column(Text, nullable=True)
    certifications = Column(JSON, default=list)
    languages = Column(JSON, default=list)
    location = Column(String(200), nullable=True)
    is_available = Column(Boolean, default=True)
    rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    completed_sessions = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="expert_profile")
    services = relationship("ExpertService", back_populates="expert_profile")

class ClientProfile(Base):
    __tablename__ = "client_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    preferences = Column(JSON, default=dict)  # {"categories": [], "max_rate": 100, etc.}
    total_bookings = Column(Integer, default=0)
    total_spent = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="client_profile")

class ExpertService(Base):
    __tablename__ = "expert_services"
    id = Column(Integer, primary_key=True, index=True)
    expert_profile_id = Column(Integer, ForeignKey("expert_profiles.id"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    price_per_hour = Column(Float, nullable=False)
    duration_minutes = Column(Integer, default=60)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    expert_profile = relationship("ExpertProfile", back_populates="services")
