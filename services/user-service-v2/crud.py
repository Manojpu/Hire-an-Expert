from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.orm import Session 
from typing import List, Optional, Dict, Any
import uuid
from models import User,  UserRole, ExpertProfile
from schemas import UserCreate, UserUpdate, PreferenceCreate, PreferenceUpdate, ProvisionIn, ExpertProfileIn, UserOut, ExpertProfileOut, UserResponse, PaginationParams, PaginatedResponse, ErrorResponse, ValidationErrorResponse, SuccessResponse
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload



# User CRUD operations    
def upsert_user(db: Session, uid: str, email: str, full_name: str, is_expert=True, expert_profiles=[]):
    user = db.query(User).filter(User.firebase_uid == uid).first()
    if user:
        user.email = email
        user.name = full_name
        user.is_expert = is_expert
    else:
        user = User(firebase_uid=uid, email=email, name=full_name, is_expert=is_expert)
        db.add(user)
        db.commit()
        db.refresh(user)

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
        profile_image_url=user_data.profile_image_url
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