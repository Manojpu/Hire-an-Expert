from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any
import uuid
from models import User, Preference, UserRole
from schemas import UserCreate, UserUpdate, PreferenceCreate, PreferenceUpdate


# User CRUD operations
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


async def get_user_by_firebase_uid(db: AsyncSession, firebase_uid: str) -> Optional[User]:
    """Get user by Firebase UID"""
    result = await db.execute(select(User).where(User.firebase_uid == firebase_uid))
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


async def get_user_with_preferences(db: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
    """Get user with all preferences loaded"""
    result = await db.execute(
        select(User)
        .options(selectinload(User.preferences))
        .where(User.id == user_id)
    )
    return result.scalar_one_or_none()


# Preference CRUD operations
async def get_user_preferences(db: AsyncSession, user_id: uuid.UUID) -> List[Preference]:
    """Get all preferences for a user"""
    result = await db.execute(
        select(Preference).where(Preference.user_id == user_id)
    )
    return result.scalars().all()


async def get_user_preference(db: AsyncSession, user_id: uuid.UUID, key: str) -> Optional[Preference]:
    """Get a specific preference for a user"""
    result = await db.execute(
        select(Preference)
        .where(Preference.user_id == user_id, Preference.key == key)
    )
    return result.scalar_one_or_none()


async def create_user_preference(
    db: AsyncSession, 
    user_id: uuid.UUID, 
    preference_data: PreferenceCreate
) -> Preference:
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


async def update_user_preference(
    db: AsyncSession, 
    user_id: uuid.UUID, 
    key: str, 
    preference_data: PreferenceUpdate
) -> Optional[Preference]:
    """Update a specific preference for a user"""
    stmt = (
        update(Preference)
        .where(Preference.user_id == user_id, Preference.key == key)
        .values(value=preference_data.value)
    )
    await db.execute(stmt)
    await db.commit()
    
    return await get_user_preference(db, user_id, key)


async def delete_user_preference(db: AsyncSession, user_id: uuid.UUID, key: str) -> bool:
    """Delete a specific preference for a user"""
    preference = await get_user_preference(db, user_id, key)
    if not preference:
        return False
    
    await db.delete(preference)
    await db.commit()
    return True


async def create_or_update_user_preference(
    db: AsyncSession, 
    user_id: uuid.UUID, 
    key: str, 
    value: str
) -> Preference:
    """Create or update a preference (upsert operation)"""
    existing_preference = await get_user_preference(db, user_id, key)
    
    if existing_preference:
        # Update existing preference
        stmt = (
            update(Preference)
            .where(Preference.user_id == user_id, Preference.key == key)
            .values(value=value)
        )
        await db.execute(stmt)
        await db.commit()
        await db.refresh(existing_preference)
        return existing_preference
    else:
        # Create new preference
        new_preference = Preference(
            user_id=user_id,
            key=key,
            value=value
        )
        db.add(new_preference)
        await db.commit()
        await db.refresh(new_preference)
        return new_preference


async def bulk_create_preferences(
    db: AsyncSession, 
    user_id: uuid.UUID, 
    preferences: List[PreferenceCreate]
) -> List[Preference]:
    """Bulk create preferences for a user"""
    db_preferences = []
    for pref_data in preferences:
        db_pref = Preference(
            user_id=user_id,
            key=pref_data.key,
            value=pref_data.value
        )
        db_preferences.append(db_pref)
    
    db.add_all(db_preferences)
    await db.commit()
    
    # Refresh all created preferences
    for pref in db_preferences:
        await db.refresh(pref)
    
    return db_preferences


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