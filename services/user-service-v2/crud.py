from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.orm import Session 
from typing import List, Optional, Dict, Any
import uuid
from uuid import UUID as UUID4
from models import User, UserRole, ExpertProfile, Preference, VerificationDocument, DocumentType, AvailabilityRule
from schemas import (
    AvailabilityRuleCreate, UserCreate, UserUpdate, PreferenceCreate, PreferenceUpdate, 
    ProvisionIn, ExpertProfileIn, UserOut, ExpertProfileOut, 
    UserResponse, PaginationParams, PaginatedResponse, 
    ErrorResponse, ValidationErrorResponse, SuccessResponse,
    VerificationDocumentCreate, VerificationDocumentResponse,
    ExpertVerificationUpdate, ExpertVerificationResponse,
    AvailabilityRuleCreate
)
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
# Removing problematic relative import



# User CRUD operations    
def upsert_user(db: Session, uid: str, email: str, name: str, is_expert=True, expert_profiles=[]):  # Changed full_name to name
    user = db.query(User).filter(User.firebase_uid == uid).first()
    if user:
        user.email = email
        user.name = name  # Changed from full_name to name
        user.is_expert = is_expert
    else:
        user = User(firebase_uid=uid, email=email, name=name, is_expert=is_expert)  # Changed from full_name to name
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create default preferences for new users
        default_preferences = [
            Preference(user_id=user.id, key="email_notifications", value="true"),
            Preference(user_id=user.id, key="sms_notifications", value="false"),
            Preference(user_id=user.id, key="marketing_emails", value="true"),
            Preference(user_id=user.id, key="profile_visibility", value="true"),
            Preference(user_id=user.id, key="contact_visibility", value="true"),
        ]
        for pref in default_preferences:
            db.add(pref)

    # handle expert profiles
    if is_expert and expert_profiles:
        # delete existing
        db.query(ExpertProfile).filter(ExpertProfile.user_id == user.id).delete()
        for profile in expert_profiles:
            ep = ExpertProfile(user_id=user.id, specialization=profile.specialization)
            db.add(ep)
    db.commit()
    db.refresh(user)
    return user

async def create_user(db: AsyncSession, user_data: UserCreate) -> User:
    """Create a new user"""
    db_user = User(
        firebase_uid=user_data.firebase_uid,
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone,
        role=user_data.role,
        bio=user_data.bio, 
        profile_image_url=user_data.profile_image_url,
        location=user_data.location
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
    """Get user by ID"""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


# async def get_user_by_firebase_uid(db: AsyncSession, firebase_uid: str) -> Optional[User]:
#     """Get user by Firebase UID"""
#     result = await db.execute(select(User).where(User.firebase_uid == firebase_uid))
#     return result.scalar_one_or_none()

async def get_user_by_firebase_uid(db: AsyncSession, firebase_uid: str):
    result = await db.execute(
        select(User)
        .options(selectinload(User.expert_profiles))
        .where(User.firebase_uid == firebase_uid)
    )
    return result.scalar_one_or_none()

async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Get user by email"""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_users(
    db: AsyncSession, 
    skip: int = 0, 
    limit: int = 100,
    role: Optional[UserRole] = None
) -> List[User]:
    """Get users with optional filtering by role"""
    query = select(User)
    if role:
        query = query.where(User.role == role)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


async def update_user(db: AsyncSession, user_id: uuid.UUID, user_data: UserUpdate) -> Optional[User]:
    """Update user information"""
    # Build update data dict (only include non-None values)
    update_data = {}
    for field, value in user_data.dict(exclude_unset=True).items():
        if value is not None:
            update_data[field] = value
    
    if not update_data:
        return await get_user_by_id(db, user_id)
    
    # Update the user
    stmt = update(User).where(User.id == user_id).values(**update_data)
    await db.execute(stmt)
    await db.commit()
    
    # Return updated user
    return await get_user_by_id(db, user_id)


async def delete_user(db: AsyncSession, user_id: uuid.UUID) -> bool:
    """Delete a user"""
    user = await get_user_by_id(db, user_id)
    if not user:
        return False
    
    await db.delete(user)
    await db.commit()
    return True



# Utility functions
async def user_exists(db: AsyncSession, user_id: uuid.UUID) -> bool:
    """Check if a user exists"""
    result = await db.execute(select(User.id).where(User.id == user_id))
    return result.scalar_one_or_none() is not None


async def firebase_uid_exists(db: AsyncSession, firebase_uid: str) -> bool:
    """Check if a Firebase UID already exists"""
    result = await db.execute(select(User.id).where(User.firebase_uid == firebase_uid))
    return result.scalar_one_or_none() is not None


async def email_exists(db: AsyncSession, email: str) -> bool:
    """Check if an email already exists"""
    result = await db.execute(select(User.id).where(User.email == email))
    return result.scalar_one_or_none() is not None


async def get_users_count(db: AsyncSession, role: Optional[UserRole] = None) -> int:
    """Get total count of users, optionally filtered by role"""
    query = select(User.id)
    if role:
        query = query.where(User.role == role)
    result = await db.execute(query)
    return len(result.scalars().all())


# Preference CRUD operations
async def create_preference(db: AsyncSession, user_id: uuid.UUID, preference_data: PreferenceCreate) -> Preference:
    """Create a new preference for a user"""
    db_preference = Preference(
        user_id=user_id,
        key=preference_data.key,
        value=preference_data.value
    )
    db.add(db_preference)
    await db.commit()
    await db.refresh(db_preference)
    return db_preference


async def get_user_preferences(db: AsyncSession, user_id: uuid.UUID) -> List[Preference]:
    """Get all preferences for a user"""
    result = await db.execute(
        select(Preference).where(Preference.user_id == user_id)
    )
    return result.scalars().all()


async def get_preference_by_key(db: AsyncSession, user_id: uuid.UUID, key: str) -> Optional[Preference]:
    """Get a specific preference by key for a user"""
    result = await db.execute(
        select(Preference).where(Preference.user_id == user_id, Preference.key == key)
    )
    return result.scalar_one_or_none()


async def update_preference(db: AsyncSession, user_id: uuid.UUID, key: str, preference_data: PreferenceUpdate) -> Optional[Preference]:
    """Update a preference value"""
    stmt = update(Preference).where(
        Preference.user_id == user_id, 
        Preference.key == key
    ).values(value=preference_data.value)
    
    await db.execute(stmt)
    await db.commit()
    
    return await get_preference_by_key(db, user_id, key)


async def upsert_preference(db: AsyncSession, user_id: uuid.UUID, key: str, value: str) -> Preference:
    """Create or update a preference"""
    existing = await get_preference_by_key(db, user_id, key)
    
    if existing:
        # Update existing preference
        await update_preference(db, user_id, key, PreferenceUpdate(value=value))
        return await get_preference_by_key(db, user_id, key)
    else:
        # Create new preference
        return await create_preference(db, user_id, PreferenceCreate(key=key, value=value))


async def delete_preference(db: AsyncSession, user_id: uuid.UUID, key: str) -> bool:
    """Delete a preference"""
    preference = await get_preference_by_key(db, user_id, key)
    if not preference:
        return False
    
    await db.delete(preference)
    await db.commit()
    return True


async def bulk_upsert_preferences(db: AsyncSession, user_id: uuid.UUID, preferences: List[PreferenceCreate]) -> List[Preference]:
    """Bulk create or update preferences"""
    result_preferences = []
    
    for pref in preferences:
        upserted = await upsert_preference(db, user_id, pref.key, pref.value)
        result_preferences.append(upserted)
    
    return result_preferences 

# Verification Document CRUD operations
async def create_verification_document(
    db: AsyncSession,
    user_id: uuid.UUID,
    document_type: DocumentType,
    document_url: str
) -> VerificationDocument:
    """
    Creates a new verification document record in the database.
    """
    db_document = VerificationDocument(
        user_id=user_id,
        document_type=document_type,
        document_url=document_url
    )
    db.add(db_document)
    await db.commit()
    await db.refresh(db_document)
    return db_document

async def get_documents_by_user(db: AsyncSession, user_id: uuid.UUID) -> List[VerificationDocument]:
    """
    Retrieves all verification documents for a specific user.
    """
    query = select(VerificationDocument).where(VerificationDocument.user_id == user_id)
    result = await db.execute(query)
    return result.scalars().all()

async def get_verification_documents(db: AsyncSession, user_id: uuid.UUID) -> List[VerificationDocument]:
    """Get all verification documents for a user"""
    query = select(VerificationDocument).where(VerificationDocument.user_id == user_id)
    result = await db.execute(query)
    return result.scalars().all()

async def get_verification_document_by_id(db: AsyncSession, doc_id: uuid.UUID) -> Optional[VerificationDocument]:
    """Get a verification document by ID"""
    query = select(VerificationDocument).where(VerificationDocument.id == doc_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()

async def delete_verification_document(db: AsyncSession, doc_id: uuid.UUID) -> bool:
    """Delete a verification document"""
    document = await get_verification_document_by_id(db, doc_id)
    if not document:
        return False
    await db.delete(document)
    await db.commit()
    return True

# Expert Verification CRUD operations
async def update_expert_verification_status(db: AsyncSession, expert_profile_id: uuid.UUID, is_verified: bool) -> Optional[ExpertProfile]:
    """Update the verification status of an expert profile"""
    query = select(ExpertProfile).where(ExpertProfile.id == expert_profile_id)
    result = await db.execute(query)
    expert_profile = result.scalar_one_or_none()
    
    if not expert_profile:
        return None
    
    expert_profile.is_verified = is_verified
    await db.commit()
    await db.refresh(expert_profile)
    return expert_profile

async def get_all_expert_profiles(db: AsyncSession, verified_only: bool = False) -> List[ExpertProfile]:
    """Get all expert profiles, optionally filtered by verification status"""
    query = select(ExpertProfile).options(selectinload(ExpertProfile.user))
    
    if verified_only:
        query = query.where(ExpertProfile.is_verified == True)
    
    result = await db.execute(query)
    return result.scalars().all()

async def set_availability_rules(db: Session, user_id: UUID4, rules: List[AvailabilityRuleCreate]) -> List[AvailabilityRule]:
    """Deletes old rules and creates a new set of availability rules for a user."""
    
    # Delete all existing rules for this user first
    db.query(AvailabilityRule).filter(AvailabilityRule.user_id == user_id).delete()
    
    db_rules = []
    for rule in rules:
        db_rule = models.AvailabilityRule(
            user_id=user_id,
            **rule.dict()
        )
        db_rules.append(db_rule)
    
    db.add_all(db_rules)
    db.commit()
    return db_rules

async def get_availability_rules_for_user(db: Session, user_id: UUID4) -> List[AvailabilityRule]:
    """Gets all availability rules for a specific user."""
    return db.query(AvailabilityRule).filter(AvailabilityRule.user_id == user_id).all()
