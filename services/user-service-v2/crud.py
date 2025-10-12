from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.orm import Session 
from typing import List, Optional, Dict, Any
import uuid
from uuid import UUID as UUID4
from datetime import datetime, date, time, timedelta
from models import User, UserRole, ExpertProfile, Preference, VerificationDocument, DocumentType, AvailabilityRule, DateOverride, AvailabilitySlot
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

def _check_for_duplicate_time_slots(rules: List[AvailabilityRuleCreate]) -> Optional[str]:
    """
    Check for duplicate or overlapping time slots within the list of rules.
    Returns an error message if duplicates/overlaps found, None otherwise.
    """
    # Group rules by day of the week for easier comparison
    day_rules = {}
    for i, rule in enumerate(rules):
        day = rule.day_of_week
        if day not in day_rules:
            day_rules[day] = []
        day_rules[day].append((i, rule))
    
    # Check for duplicates/overlaps within each day
    for day, day_rule_list in day_rules.items():
        for i, (idx1, rule1) in enumerate(day_rule_list):
            # Convert times to minutes for easier comparison
            start1_h, start1_m = map(int, rule1.start_time_utc.split(':'))
            end1_h, end1_m = map(int, rule1.end_time_utc.split(':'))
            start1_mins = start1_h * 60 + start1_m
            end1_mins = end1_h * 60 + end1_m
            
            for j, (idx2, rule2) in enumerate(day_rule_list[i+1:], i+1):
                # Convert times to minutes
                start2_h, start2_m = map(int, rule2.start_time_utc.split(':'))
                end2_h, end2_m = map(int, rule2.end_time_utc.split(':'))
                start2_mins = start2_h * 60 + start2_m
                end2_mins = end2_h * 60 + end2_m
                
                # Check for exact duplicates
                if start1_mins == start2_mins and end1_mins == end2_mins:
                    return f"Duplicate time slot found: {rule1.start_time_utc}-{rule1.end_time_utc} on day {day}"
                
                # Check for overlaps
                if (start1_mins < end2_mins and end1_mins > start2_mins):
                    return f"Overlapping time slots found: {rule1.start_time_utc}-{rule1.end_time_utc} and {rule2.start_time_utc}-{rule2.end_time_utc} on day {day}"
    
    return None

async def set_availability_rules(db: AsyncSession, user_id: UUID4, rules: List[AvailabilityRuleCreate], dateOverrides: List[DateOverrideCreate] = None) -> List[AvailabilityRule]:
    """
    Deletes old rules and date overrides, and creates a new set of availability rules for a user.
    Also handles date overrides for unavailable dates.
    Checks for duplicates and overlapping time slots before saving.
    """
    # Check for duplicate or overlapping time slots
    error_message = _check_for_duplicate_time_slots(rules)
    if error_message:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=error_message)
    
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
    # Generate slots for the next 30 days
    from datetime import date, timedelta
    today = date.today()
    end_date = today + timedelta(days=30)
    
    await generate_availability_slots(db, user_id, today, end_date)

    return db_rules

async def get_availability_rules_for_user(db: AsyncSession, user_id: UUID4) -> List[AvailabilityRule]:
    """Gets all availability rules for a specific user."""
    result = await db.execute(
        select(AvailabilityRule).where(AvailabilityRule.user_id == user_id)
    )
    return result.scalars().all()


async def generate_availability_slots(
    db: AsyncSession, 
    user_id: UUID4, 
    start_date: date, 
    end_date: date, 
    slot_duration_minutes: int = 60
) -> List[AvailabilitySlot]:
    """
    Generate availability slots based on rules and date overrides for a specific date range.
    
    Args:
        db: Database session
        user_id: User ID to generate slots for
        start_date: First date to generate slots for
        end_date: Last date to generate slots for
        slot_duration_minutes: Duration of each slot in minutes
    
    Returns:
        List of created availability slots
    """
    # Get the user's availability rules
    rules_result = await db.execute(
        select(AvailabilityRule).where(AvailabilityRule.user_id == user_id)
    )
    availability_rules = rules_result.scalars().all()
    
    # Get date overrides (days when the user is not available)
    overrides_result = await db.execute(
        select(DateOverride).where(DateOverride.user_id == user_id)
    )
    unavailable_dates = [override.unavailable_date for override in overrides_result.scalars().all()]
    
    # Delete existing slots in the date range to avoid duplicates
    await db.execute(
        delete(AvailabilitySlot).where(
            AvailabilitySlot.user_id == user_id,
            AvailabilitySlot.date >= start_date,
            AvailabilitySlot.date <= end_date,
            AvailabilitySlot.is_booked == False  # Don't delete already booked slots
        )
    )
    
    # Generate slots based on rules
    current_date = start_date
    slots = []
    
    while current_date <= end_date:
        # Skip if this date is in the unavailable dates list
        if current_date in unavailable_dates:
            current_date += timedelta(days=1)
            continue
        
        # Find rules applicable for this day of the week (0=Monday, 6=Sunday)
        day_of_week = current_date.weekday()
        applicable_rules = [rule for rule in availability_rules if rule.day_of_week == day_of_week]
        
        for rule in applicable_rules:
            # Parse start and end times
            start_time_parts = [int(part) for part in rule.start_time_utc.split(':')]
            end_time_parts = [int(part) for part in rule.end_time_utc.split(':')]
            
            start_datetime = datetime.combine(
                current_date, 
                time(hour=start_time_parts[0], minute=start_time_parts[1])
            )
            end_datetime = datetime.combine(
                current_date, 
                time(hour=end_time_parts[0], minute=end_time_parts[1])
            )
            
            # Generate slots of the specified duration
            slot_start = start_datetime
            while slot_start < end_datetime:
                slot_end = min(slot_start + timedelta(minutes=slot_duration_minutes), end_datetime)
                
                # Only create the slot if it's at least half the intended duration
                if (slot_end - slot_start).total_seconds() >= slot_duration_minutes * 30:
                    slots.append(AvailabilitySlot(
                        user_id=user_id,
                        date=current_date,
                        start_time=slot_start.time(),
                        end_time=slot_end.time(),
                        is_booked=False
                    ))
                
                slot_start = slot_end
        
        current_date += timedelta(days=1)
    
    # Save all slots to the database
    db.add_all(slots)
    await db.commit()
    
    # Return the created slots
    return slots


async def get_user_analytics_data(
    db: AsyncSession, 
    user_type: Optional[str] = None, 
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None
):
    """
    Get user analytics data for admin dashboard.
    Returns daily user counts within the specified date range.
    """
    from sqlalchemy import func
    from schemas import UserAnalyticsResponse, DailyUserCount
    from datetime import datetime, timedelta
    
    try:
        # Parse dates
        if start_date:
            start_dt = datetime.strptime(start_date, '%Y-%m-%d')
        else:
            # Default to 30 days ago
            start_dt = datetime.now() - timedelta(days=30)
        
        if end_date:
            end_dt = datetime.strptime(end_date, '%Y-%m-%d')
        else:
            # Default to today
            end_dt = datetime.now()
        
        # Build the query for daily counts
        query = select(
            func.date(User.created_at).label('date'),
            func.count(User.id).label('count')
        ).where(
            User.created_at >= start_dt,
            User.created_at <= end_dt
        )
        
        # Add user type filter if specified (but not for 'all')
        if user_type and user_type != 'all':
            if user_type == 'expert':
                query = query.where(User.role == 'expert')
            elif user_type == 'client':
                query = query.where(User.role == 'client')
        
        query = query.group_by(
            func.date(User.created_at)
        ).order_by(
            func.date(User.created_at)
        )
        
        result = await db.execute(query)
        daily_data = result.all()
        
        # Create a dictionary of existing data for easy lookup
        data_dict = {row.date.strftime('%Y-%m-%d'): row.count for row in daily_data}
        
        # Get cumulative count up to start_date
        cumulative_base_query = select(func.count(User.id)).where(
            User.created_at < start_dt
        )
        
        # Add user type filter for cumulative base
        if user_type and user_type != 'all':
            if user_type == 'expert':
                cumulative_base_query = cumulative_base_query.where(User.role == 'expert')
            elif user_type == 'client':
                cumulative_base_query = cumulative_base_query.where(User.role == 'client')
        
        cumulative_base_result = await db.execute(cumulative_base_query)
        cumulative_count = cumulative_base_result.scalar() or 0
        
        # Generate all dates in the range and calculate cumulative counts
        daily_counts = []
        current_date = start_dt.date()
        end_date_obj = end_dt.date()
        
        while current_date <= end_date_obj:
            date_str = current_date.strftime('%Y-%m-%d')
            daily_new_users = data_dict.get(date_str, 0)  # New users on this date
            cumulative_count += daily_new_users  # Add to cumulative total
            
            daily_counts.append(DailyUserCount(
                date=date_str,
                count=cumulative_count  # Use cumulative count instead of daily count
            ))
            current_date += timedelta(days=1)
        
        # For total count, we want ALL users of that type ever registered, not just in date range
        total_query = select(func.count(User.id))
        
        # Apply user type filter for total count
        if user_type and user_type != 'all':
            if user_type == 'expert':
                total_query = total_query.where(User.role == 'expert')
            elif user_type == 'client':
                total_query = total_query.where(User.role == 'client')
        
        total_result = await db.execute(total_query)
        total_count = total_result.scalar()
        
        return UserAnalyticsResponse(
            data=daily_counts,
            total_count=total_count or 0
        )
        
    except Exception as e:
        raise e
