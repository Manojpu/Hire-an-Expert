from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.orm import Session 
from typing import List, Optional, Dict, Any
import uuid
from uuid import UUID as UUID4
from models import User, UserRole, ExpertProfile, Preference, VerificationDocument, DocumentType, AvailabilityRule, DateOverride
from schemas import (
    AvailabilityRuleCreate, DateOverrideCreate, UserCreate, UserUpdate, PreferenceCreate, PreferenceUpdate, 
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
    
# Synchronous version of get_user_by_firebase_uid
def get_user_by_firebase_uid(db: Session, firebase_uid: str) -> Optional[User]:
    """Get user by Firebase UID (synchronous version)"""
    return db.query(User).filter(User.firebase_uid == firebase_uid).first()

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

async def set_availability_rules(db: AsyncSession, user_id: UUID4, rules: List[AvailabilityRuleCreate], dateOverrides: List[DateOverrideCreate] = None) -> List[AvailabilityRule]:
    """
    Deletes old rules and date overrides, and creates a new set of availability rules for a user.
    Also handles date overrides for unavailable dates.
    """
    
    # Delete all existing rules for this user first
    await db.execute(delete(AvailabilityRule).where(AvailabilityRule.user_id == user_id))
    
    # Delete existing date overrides for this user
    await db.execute(delete(DateOverride).where(DateOverride.user_id == user_id))
    
    # Process availability rules
    db_rules = []
    for rule in rules:
        # Check if we need to use dict() or model_dump() based on Pydantic version
        try:
            rule_data = rule.model_dump()  # Pydantic v2
        except AttributeError:
            rule_data = rule.dict()  # Pydantic v1
        
        db_rule = AvailabilityRule(
            user_id=user_id,
            **rule_data
        )
        db_rules.append(db_rule)
    
    db.add_all(db_rules)
    
    # Process date overrides if provided
    if dateOverrides:
        db_date_overrides = []
        for override in dateOverrides:
            try:
                override_data = override.model_dump()  # Pydantic v2
            except AttributeError:
                override_data = override.dict()  # Pydantic v1
            
            # Parse the date string to a datetime object
            from datetime import datetime
            date_str = override_data.get('unavailable_date')
            date_obj = datetime.strptime(date_str, "%Y-%m-%d")
            
            db_date_override = DateOverride(
                user_id=user_id,
                unavailable_date=date_obj
            )
            db_date_overrides.append(db_date_override)
        
        db.add_all(db_date_overrides)
    
    await db.commit()
    return db_rules

async def get_availability_rules_for_user(db: AsyncSession, user_id: UUID4) -> List[AvailabilityRule]:
    """Gets all availability rules for a specific user."""
    result = await db.execute(
        select(AvailabilityRule).where(AvailabilityRule.user_id == user_id)
    )
    return result.scalars().all()


# Analytics CRUD operations
async def get_user_analytics(db: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None, user_type: str = "all"):
    """Get cumulative user count analytics by date."""
    from sqlalchemy import func, text
    from datetime import datetime, timedelta, date
    
    # Base query to get all users with their creation dates
    base_query = select(
        func.date(User.created_at).label('date'),
        User.id
    )
    
    # Add user type filter
    if user_type == "expert":
        base_query = base_query.where(User.role == UserRole.EXPERT)
    elif user_type == "client":
        base_query = base_query.where(User.role == UserRole.CLIENT)
    
    # Don't filter by date in the base query - we need all historical data for cumulative counts
    base_query = base_query.order_by(func.date(User.created_at))
    
    result = await db.execute(base_query)
    all_users = result.fetchall()
    
    # Group users by date and calculate cumulative counts
    daily_counts = {}
    cumulative_count = 0
    
    for user in all_users:
        user_date = str(user.date)
        if user_date not in daily_counts:
            daily_counts[user_date] = 0
        daily_counts[user_date] += 1
    
    # Generate cumulative data for all dates
    cumulative_data = []
    sorted_dates = sorted(daily_counts.keys())
    
    for date_str in sorted_dates:
        cumulative_count += daily_counts[date_str]
        cumulative_data.append({
            "date": date_str,
            "count": cumulative_count
        })
    
    # If no data, return empty
    if not cumulative_data:
        return {
            "data": [],
            "total_count": 0,
            "user_type": user_type
        }
    
    # If no date filters, return all data
    if not start_date and not end_date:
        return {
            "data": cumulative_data,
            "total_count": cumulative_data[-1]["count"],
            "user_type": user_type
        }
    
    # Filter and fill the requested date range
    try:
        start_dt = datetime.strptime(start_date, '%Y-%m-%d').date() if start_date else None
        end_dt = datetime.strptime(end_date, '%Y-%m-%d').date() if end_date else None
        
        # Create a dictionary for quick lookup
        data_dict = {datetime.strptime(dp["date"], '%Y-%m-%d').date(): dp["count"] for dp in cumulative_data}
        
        # Get date range bounds
        all_dates = sorted(data_dict.keys())
        first_data_date = all_dates[0]
        last_data_date = all_dates[-1]
        
        # Determine the actual range to show
        range_start = start_dt if start_dt and start_dt >= first_data_date else first_data_date
        range_end = end_dt if end_dt else last_data_date
        
        # If start date is before any data, start from first data date
        if start_dt and start_dt < first_data_date:
            range_start = first_data_date
        
        filtered_data = []
        current_date = range_start
        
        while current_date <= range_end:
            if current_date in data_dict:
                # Use actual data point
                count = data_dict[current_date]
            elif current_date <= last_data_date:
                # Use cumulative count from previous date
                count = filtered_data[-1]["count"] if filtered_data else 0
            else:
                # After last data date, maintain the final count
                count = data_dict[last_data_date]
            
            filtered_data.append({
                "date": current_date.isoformat(),
                "count": count
            })
            
            current_date += timedelta(days=1)
        
        # Get total count (final cumulative count)
        total_count = data_dict[last_data_date] if data_dict else 0
        
        return {
            "data": filtered_data,
            "total_count": total_count,
            "user_type": user_type
        }
        
    except ValueError as e:
        # Return filtered data if date parsing fails
        filtered_data = []
        for item in cumulative_data:
            item_date = datetime.strptime(item["date"], "%Y-%m-%d").date()
            
            # Check if date is within range
            include_date = True
            if start_date:
                start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").date()
                if item_date < start_date_obj:
                    include_date = False
            
            if end_date:
                end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").date()
                if item_date > end_date_obj:
                    include_date = False
            
            if include_date:
                filtered_data.append(item)
        
        # Get total count up to end_date (or all time if no end_date)
        total_count = 0
        if filtered_data:
            total_count = filtered_data[-1]["count"]
        
        return {
            "data": filtered_data,
            "total_count": total_count,
            "user_type": user_type
        }


async def get_daily_registrations(db: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None, user_type: str = "all"):
    """Get daily user registration counts (non-cumulative)."""
    from sqlalchemy import func
    from datetime import datetime
    
    # Base query
    query = select(
        func.date(User.created_at).label('date'),
        func.count(User.id).label('count')
    )
    
    # Add user type filter
    if user_type == "expert":
        query = query.where(User.role == UserRole.EXPERT)
    elif user_type == "client":
        query = query.where(User.role == UserRole.CLIENT)
    
    # Add date filters
    if start_date:
        query = query.where(User.created_at >= start_date)
    if end_date:
        query = query.where(User.created_at <= end_date)
    
    # Group by date and order
    query = query.group_by(func.date(User.created_at)).order_by(func.date(User.created_at))
    
    result = await db.execute(query)
    data = result.fetchall()
    
    # Get total count for the period
    total_query = select(func.count(User.id))
    if user_type == "expert":
        total_query = total_query.where(User.role == UserRole.EXPERT)
    elif user_type == "client":
        total_query = total_query.where(User.role == UserRole.CLIENT)
    
    if start_date:
        total_query = total_query.where(User.created_at >= start_date)
    if end_date:
        total_query = total_query.where(User.created_at <= end_date)
    
    total_result = await db.execute(total_query)
    total_count = total_result.scalar() or 0
    
    return {
        "data": [{"date": str(row.date), "count": row.count} for row in data],
        "total_count": total_count,
        "user_type": user_type
    }
