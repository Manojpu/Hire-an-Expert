from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from passlib.context import CryptContext
from typing import List, Optional
import models, schemas

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Password utilities
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# User CRUD operations
def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate, role: str = "client") -> models.User:
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        phone_number=user.phone_number,
        role=role,
        profile_picture_url=user.profile_picture_url
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate) -> Optional[models.User]:
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int) -> bool:
    db_user = get_user(db, user_id)
    if not db_user:
        return False
    db.delete(db_user)
    db.commit()
    return True

# Expert Profile CRUD operations
def get_expert_profile(db: Session, expert_id: int) -> Optional[models.ExpertProfile]:
    return db.query(models.ExpertProfile).filter(models.ExpertProfile.id == expert_id).first()

def get_expert_profile_by_user_id(db: Session, user_id: int) -> Optional[models.ExpertProfile]:
    return db.query(models.ExpertProfile).filter(models.ExpertProfile.user_id == user_id).first()

def get_expert_profiles(db: Session, skip: int = 0, limit: int = 100) -> List[models.ExpertProfile]:
    return db.query(models.ExpertProfile).offset(skip).limit(limit).all()

def create_expert_profile(db: Session, user_id: int, expert_profile: schemas.ExpertProfileCreate) -> models.ExpertProfile:
    db_expert_profile = models.ExpertProfile(
        user_id=user_id,
        **expert_profile.dict()
    )
    db.add(db_expert_profile)
    db.commit()
    db.refresh(db_expert_profile)
    return db_expert_profile

def update_expert_profile(db: Session, expert_id: int, expert_update: schemas.ExpertProfileUpdate) -> Optional[models.ExpertProfile]:
    db_expert_profile = get_expert_profile(db, expert_id)
    if not db_expert_profile:
        return None
    
    update_data = expert_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_expert_profile, field, value)
    
    db.commit()
    db.refresh(db_expert_profile)
    return db_expert_profile

def search_experts(db: Session, search_params: schemas.ExpertSearchParams) -> tuple[List[models.ExpertProfile], int]:
    query = db.query(models.ExpertProfile)
    
    # Apply filters
    if search_params.categories:
        query = query.filter(models.ExpertProfile.categories.overlap(search_params.categories))
    
    if search_params.skills:
        query = query.filter(models.ExpertProfile.skills.overlap(search_params.skills))
    
    if search_params.min_rating is not None:
        query = query.filter(models.ExpertProfile.rating >= search_params.min_rating)
    
    if search_params.max_hourly_rate is not None:
        query = query.filter(models.ExpertProfile.hourly_rate <= search_params.max_hourly_rate)
    
    if search_params.location:
        query = query.filter(models.ExpertProfile.location.ilike(f"%{search_params.location}%"))
    
    if search_params.is_available is not None:
        query = query.filter(models.ExpertProfile.is_available == search_params.is_available)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    experts = query.offset(search_params.offset).limit(search_params.limit).all()
    
    return experts, total

# Expert Service CRUD operations
def get_expert_service(db: Session, service_id: int) -> Optional[models.ExpertService]:
    return db.query(models.ExpertService).filter(models.ExpertService.id == service_id).first()

def get_expert_services(db: Session, expert_profile_id: int) -> List[models.ExpertService]:
    return db.query(models.ExpertService).filter(
        models.ExpertService.expert_profile_id == expert_profile_id,
        models.ExpertService.is_active == True
    ).all()

def create_expert_service(db: Session, expert_profile_id: int, service: schemas.ExpertServiceCreate) -> models.ExpertService:
    db_service = models.ExpertService(
        expert_profile_id=expert_profile_id,
        **service.dict()
    )
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    return db_service

def update_expert_service(db: Session, service_id: int, service_update: schemas.ExpertServiceUpdate) -> Optional[models.ExpertService]:
    db_service = get_expert_service(db, service_id)
    if not db_service:
        return None
    
    update_data = service_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_service, field, value)
    
    db.commit()
    db.refresh(db_service)
    return db_service

def delete_expert_service(db: Session, service_id: int) -> bool:
    db_service = get_expert_service(db, service_id)
    if not db_service:
        return False
    db.delete(db_service)
    db.commit()
    return True

# Client Profile CRUD operations
def get_client_profile(db: Session, client_id: int) -> Optional[models.ClientProfile]:
    return db.query(models.ClientProfile).filter(models.ClientProfile.id == client_id).first()

def get_client_profile_by_user_id(db: Session, user_id: int) -> Optional[models.ClientProfile]:
    return db.query(models.ClientProfile).filter(models.ClientProfile.user_id == user_id).first()

def create_client_profile(db: Session, user_id: int, client_profile: schemas.ClientProfileCreate) -> models.ClientProfile:
    db_client_profile = models.ClientProfile(
        user_id=user_id,
        **client_profile.dict()
    )
    db.add(db_client_profile)
    db.commit()
    db.refresh(db_client_profile)
    return db_client_profile

def update_client_profile(db: Session, client_id: int, client_update: schemas.ClientProfileUpdate) -> Optional[models.ClientProfile]:
    db_client_profile = get_client_profile(db, client_id)
    if not db_client_profile:
        return None
    
    update_data = client_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_client_profile, field, value)
    
    db.commit()
    db.refresh(db_client_profile)
    return db_client_profile

# Category and Skill utilities
def get_categories() -> List[dict]:
    """Return predefined categories for the platform"""
    return [
        {"name": "vehicles", "description": "Car, motorcycle, and vehicle repair services", "icon": "🚗"},
        {"name": "electronics", "description": "Phone, computer, and electronic device repair", "icon": "📱"},
        {"name": "home", "description": "Home improvement and maintenance services", "icon": "🏠"},
        {"name": "health", "description": "Health and wellness consultation", "icon": "🏥"},
        {"name": "education", "description": "Tutoring and educational services", "icon": "📚"},
        {"name": "business", "description": "Business consulting and strategy", "icon": "💼"},
        {"name": "technology", "description": "Software development and IT services", "icon": "💻"},
        {"name": "fitness", "description": "Personal training and fitness coaching", "icon": "💪"},
        {"name": "beauty", "description": "Beauty and personal care services", "icon": "💄"},
        {"name": "legal", "description": "Legal consultation and advice", "icon": "⚖️"}
    ]

def get_skills_by_category(category: str) -> List[dict]:
    """Return predefined skills for a given category"""
    skills_map = {
        "vehicles": [
            {"name": "car_repair", "description": "General car repair and maintenance"},
            {"name": "engine_diagnosis", "description": "Engine troubleshooting and repair"},
            {"name": "brake_service", "description": "Brake system repair and maintenance"},
            {"name": "oil_change", "description": "Oil change and fluid services"},
            {"name": "tire_service", "description": "Tire replacement and balancing"}
        ],
        "electronics": [
            {"name": "phone_repair", "description": "Smartphone repair and maintenance"},
            {"name": "computer_repair", "description": "Computer hardware and software repair"},
            {"name": "laptop_service", "description": "Laptop repair and upgrade services"},
            {"name": "tablet_repair", "description": "Tablet device repair"},
            {"name": "gaming_console", "description": "Gaming console repair and maintenance"}
        ],
        "home": [
            {"name": "plumbing", "description": "Plumbing repair and installation"},
            {"name": "electrical", "description": "Electrical work and repairs"},
            {"name": "carpentry", "description": "Woodwork and furniture repair"},
            {"name": "painting", "description": "Interior and exterior painting"},
            {"name": "cleaning", "description": "Deep cleaning and maintenance"}
        ]
    }
    return skills_map.get(category, [])