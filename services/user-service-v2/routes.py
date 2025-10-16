from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Form, File, UploadFile
from sqlalchemy.orm import Session
import logging
from datetime import datetime
from models import DocumentType
from config import settings
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from sqlalchemy import select
import uuid
from uuid import UUID as UUID4
from datetime import date, datetime, timedelta, time
from auth import get_current_user_id
from cloudinary_utils import upload_file as upload_to_cloudinary

# Configure logger
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)

from database import SyncSessionLocal, get_async_db
from models import User, UserRole, AvailabilitySlot, DateOverride
from schemas import (
    UserCreate, UserUpdate, UserResponse, UserOut, ProvisionIn,
    SuccessResponse, PaginationParams, PaginatedResponse,
    PreferenceCreate, PreferenceUpdate, PreferenceResponse, 
    PreferenceBulkCreate, PreferenceBulkResponse, UserWithPreferences,
    VerificationDocumentCreate, VerificationDocumentResponse,
    ExpertVerificationUpdate, ExpertVerificationResponse,
    AvailabilityRule, AvailabilityRuleCreate, DateOverrideCreate, CreateAvailabilitySchedules,
    AvailabilitySlotResponse, UserAnalyticsResponse, DailyUserCount
) 
from crud import (
    create_user, get_user_by_email, get_user_by_id, get_user_by_firebase_uid, get_users, update_user, delete_user,
    firebase_uid_exists, email_exists, upsert_user,
    create_preference, get_user_preferences, get_preference_by_key, update_preference, 
    upsert_preference, delete_preference, bulk_upsert_preferences,
    create_verification_document, get_verification_documents, get_documents_by_user, get_verification_document_by_id, delete_verification_document,
    update_expert_verification_status, get_all_expert_profiles,
    set_availability_rules, get_availability_rules_for_user, generate_availability_slots,
    get_user_analytics_data
)
from auth import get_current_user, get_current_admin, get_user_by_id_or_current, get_optional_user
# Removing problematic relative import

router = APIRouter()

# WEBHOOK_SECRET = settings.user_service_webhook_secret
WEBHOOK_SECRET = "7f6b8e2e6b9147f0b34a84d5b673d3e85d3a21b6b3c847c0a9e32f8f8a172ab4"

# For backward compatibility, using sync session
def get_db():
    db = SyncSessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/health")
def health():
    return {"ok": True}

@router.get("/test/request")
async def test_request(request: Request):
    """Test endpoint to see if requests are reaching the server"""
    print(f"🔍 TEST endpoint hit!")
    print(f"   Authorization header: {request.headers.get('authorization', 'NOT FOUND')}")
    print(f"   Headers: {dict(request.headers)}")
    return {
        "message": "Request received",
        "has_auth_header": "authorization" in request.headers,
        "auth_header": request.headers.get('authorization', 'NOT FOUND')
    }

# @router.post("/internal/users/provision", response_model=UserOut)
# async def provision_user(request: Request, db: Session = Depends(get_db)):
#     provided = request.headers.get("X-Webhook-Secret")
#     if not WEBHOOK_SECRET or provided != WEBHOOK_SECRET:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Invalid webhook secret"
#         )

#     data = await request.json()
#     payload = ProvisionIn(**data)
#     user = upsert_user(
#         db, uid=payload.firebase_uid, email=payload.email, full_name=payload.full_name
#     )
#     return user

@router.post("/internal/users/provision", response_model=UserOut)
async def provision_user(request: Request, db: Session = Depends(get_db)):
    secret = request.headers.get("X-Webhook-Secret")
    if WEBHOOK_SECRET and secret != WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Invalid secret")

    data = await request.json()
    payload = ProvisionIn(**data)

    user = upsert_user(
        db, 
        uid=payload.firebase_uid, 
        email=payload.email, 
        name=payload.name,  # Changed from full_name to name
        is_expert=payload.is_expert,
        expert_profiles=payload.expert_profiles
    )
    return user


# ==============================================================
# Added static endpoint before dynamic routes to avoid conflicts
@router.get("/users/documents", response_model=List[VerificationDocumentResponse], summary="Get user's documents")
async def get_user_documents(
    db: AsyncSession = Depends(get_async_db),
    user_id: Optional[str] = Query(None, description="User ID (required for admin access)"),
    current_user: User = Depends(get_current_user),
):
    """Retrieves all verification documents for the authenticated user."""
    # Determine which user ID to use
    target_user_id = current_user.id
    
    # If user_id is provided and the current user is admin, use the provided user_id
    if user_id and current_user.role == UserRole.ADMIN:
        try:
            target_user_id = uuid.UUID(user_id)
        except ValueError:
            # Try with firebase_uid
            try:
                result = await db.execute(select(User).where(User.firebase_uid == user_id))
                target_user = result.scalar_one_or_none()
                if target_user:
                    target_user_id = target_user.id
                else:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Target user not found"
                    )
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid user ID format: {e}"
                )
    
    logger.info(f"🔍 GET documents endpoint hit for user_id: {target_user_id}")
    return await get_documents_by_user(db=db, user_id=target_user_id)

# Public endpoints 
@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_public(
    user_id: str,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get user by ID (public endpoint)
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    user = await get_user_by_id(db, user_uuid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.get("/users/firebase/{firebase_uid}", response_model=UserResponse)
async def get_user_by_firebase_uid_public(
    firebase_uid: str,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get user by Firebase UID (public endpoint)
    """
    user = await get_user_by_firebase_uid(db, firebase_uid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


# Authenticated endpoints
@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user_endpoint(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Create a new user
    """
    # Check if Firebase UID already exists
    if await firebase_uid_exists(db, user_data.firebase_uid):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this Firebase UID already exists"
        )
    
    # Check if email already exists
    if await email_exists(db, user_data.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists"
        )
    
    user = await create_user(db, user_data)
    return user





@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user_endpoint(
    user_id: str,
    user_data: UserUpdate,
    current_user: User = Depends(get_user_by_id_or_current),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Update user information 
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    # Check if email already exists (if being updated)
    if user_data.email:
        existing_user = await get_user_by_email(db, user_data.email)
        if existing_user and existing_user.id != user_uuid:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists"
            )
    
    updated_user = await update_user(db, user_uuid, user_data)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    print(f"User updated successfully: {updated_user}")
    return UserResponse.model_validate(updated_user, from_attributes=True)



# Temporary test endpoint without authentication
@router.put("/test/users/{user_id}", response_model=UserResponse)
async def update_user_test_endpoint(
    user_id: str,
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Update user information (test endpoint without auth)
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    # Check if email already exists (if being updated)
    if user_data.email:
        existing_user = await get_user_by_email(db, user_data.email)
        if existing_user and existing_user.id != user_uuid:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists"
            )
    
    updated_user = await update_user(db, user_uuid, user_data)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return updated_user


# Admin-only endpoints
@router.get("/admin/users", response_model=PaginatedResponse)
async def get_users_admin(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    role: Optional[UserRole] = Query(None, description="Filter by role"),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get all users (admin only)
    """
    skip = (page - 1) * size
    users = await get_users(db, skip=skip, limit=size, role=role)
    
    # Get total count for pagination
    total_users = await get_users(db, skip=0, limit=1000, role=role)
    total = len(total_users)
    pages = (total + size - 1) // size
    
    return PaginatedResponse(
        items=users,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.delete("/admin/users/{user_id}", response_model=SuccessResponse)
async def delete_user_admin(
    user_id: str,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Delete user (admin only)
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    success = await delete_user(db, user_uuid)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return SuccessResponse(message="User deleted successfully")


@router.get("/admin/users/{user_id}", response_model=UserResponse)
async def get_user_admin(
    user_id: str,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get specific user details (admin only)
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    user = await get_user_by_id(db, user_uuid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        phone=user.phone,
        role=user.role,
        bio=user.bio,
        profile_image_url=user.profile_image_url,
        location=user.location,
        is_expert=user.is_expert,
        created_at=user.created_at,
        updated_at=user.updated_at
    )


# Preference endpoints
@router.get("/users/{user_id}/preferences", response_model=List[PreferenceResponse])
async def get_user_preferences_endpoint(
    user_id: str,
    request: Request,
    current_user: User = Depends(get_user_by_id_or_current),
    db: AsyncSession = Depends(get_async_db)
):
    """Get all preferences for a user"""
    print(f"🔍 GET preferences endpoint hit for user_id: {user_id}")
    print(f"   Authorization header: {request.headers.get('authorization', 'NOT FOUND')}")
    # print(f"   Current user from auth: {current_user}")
    
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    preferences = await get_user_preferences(db, user_uuid)
    print(f"✅ Returning {len(preferences)} preferences for user {user_id}")
    return preferences


@router.post("/users/{user_id}/preferences", response_model=PreferenceResponse, status_code=status.HTTP_201_CREATED)
async def create_preference_endpoint(
    user_id: str,
    preference_data: PreferenceCreate,
    # current_user: User = Depends(get_user_by_id_or_current),
    db: AsyncSession = Depends(get_async_db)
):
    """Create a new preference for a user"""
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    # Check if preference already exists
    existing = await get_preference_by_key(db, user_uuid, preference_data.key)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Preference with key '{preference_data.key}' already exists"
        )
    
    preference = await create_preference(db, user_uuid, preference_data)
    return preference


@router.put("/users/{user_id}/preferences/{preference_key}", response_model=PreferenceResponse)
async def update_preference_endpoint(
    user_id: str,
    preference_key: str,
    preference_data: PreferenceUpdate,
    # current_user: User = Depends(get_user_by_id_or_current),
    db: AsyncSession = Depends(get_async_db)
):
    """Update a preference value"""
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    updated_preference = await update_preference(db, user_uuid, preference_key, preference_data)
    if not updated_preference:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preference not found"
        )
    
    return updated_preference


@router.put("/users/{user_id}/preferences", response_model=List[PreferenceResponse])
async def bulk_upsert_preferences_endpoint(
    user_id: str,
    preferences_data: PreferenceBulkCreate,
    # current_user: User = Depends(get_user_by_id_or_current),
    db: AsyncSession = Depends(get_async_db)
):
    """Bulk create or update preferences"""
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    preferences = await bulk_upsert_preferences(db, user_uuid, preferences_data.preferences)
    return preferences


@router.delete("/users/{user_id}/preferences/{preference_key}", response_model=SuccessResponse)
async def delete_preference_endpoint(
    user_id: str,
    preference_key: str,
    # current_user: User = Depends(get_user_by_id_or_current),
    db: AsyncSession = Depends(get_async_db)
):
    """Delete a preference"""
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    success = await delete_preference(db, user_uuid, preference_key)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preference not found"
        )
    
    return SuccessResponse(message="Preference deleted successfully")

@router.post(
    "/users/documents",
    response_model=VerificationDocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a verification document"
)
async def upload_verification_document(
    db: AsyncSession = Depends(get_async_db),
    user_id: Optional[str] = Query(None, description="User ID (required for admin access)"),
    current_user: User = Depends(get_current_user),
    document_type: DocumentType = Form(...),
    file: UploadFile = File(...)
):
    """
    Uploads a verification document for the authenticated user.
    - Receives a file and its type.
    - Saves the file to a storage location.
    - Creates a record in the verification_documents table.
    """
    try:
        # Determine which user ID to use
        target_user_id = current_user.id
        
        # If user_id is provided and the current user is admin, use the provided user_id
        if user_id and current_user.role == UserRole.ADMIN:
            try:
                target_user_id = uuid.UUID(user_id)
                # Verify the target user exists
                result = await db.execute(select(User).where(User.id == target_user_id))
                target_user = result.scalar_one_or_none()
                if not target_user:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Target user not found"
                    )
            except ValueError:
                # Try with firebase_uid
                result = await db.execute(select(User).where(User.firebase_uid == user_id))
                target_user = result.scalar_one_or_none()
                if not target_user:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Target user not found"
                    )
                target_user_id = target_user.id
                
        # Upload file bytes to Cloudinary
        contents = await file.read()
        await file.seek(0)

        folder = f"{settings.cloudinary_base_folder}/verification/{target_user_id}".strip("/")
        folder_arg = folder or None
        public_id = f"{target_user_id}/{uuid.uuid4()}"

        try:
            document_url = await upload_to_cloudinary(
                file_bytes=contents,
                folder=folder_arg,
                public_id=public_id,
                resource_type="auto",
            )
        except RuntimeError as cloudinary_error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Cloudinary upload failed: {cloudinary_error}"
            ) from cloudinary_error

        # Create the database record
        db_document = await create_verification_document(
            db=db,
            user_id=target_user_id,
            document_type=document_type,
            document_url=document_url
        )
        return db_document

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not upload file: {e}"
        )
    
# Endpoint to get user by Firebase UID
@router.get(
    "/users/by-firebase-uid/{firebase_uid}",
    response_model=UserResponse,
    summary="Get user by Firebase UID"
)
async def get_user_by_firebase_uid_endpoint(
    firebase_uid: str,
    db: AsyncSession = Depends(get_async_db)
):
    user = await get_user_by_firebase_uid(db=db, firebase_uid=firebase_uid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found with this Firebase UID"
        )
    return UserResponse.model_validate(user, from_attributes=True)

#to create available time slots for experts
@router.post(
    "/users/me/availability-rules",
    response_model=List[AvailabilityRule],
    summary="Set the weekly availability rules for the current expert"
)
async def set_my_availability_rules(
    rules: CreateAvailabilitySchedules,
    db: AsyncSession = Depends(get_async_db),
    current_user_id: UUID4 = Depends(get_current_user_id) 
):
    # Log the received data
    logger.debug(f"Received availability rules: {rules.availabilityRules}")
    logger.debug(f"Received date overrides: {rules.dateOverrides}")
    
    try:
        # Process and save the availability rules
        return await set_availability_rules(db=db, user_id=current_user_id, rules=rules.availabilityRules, dateOverrides=rules.dateOverrides)
    except HTTPException as e:
        # Re-raise FastAPI HTTPException to maintain the status code and error message
        raise e
    except Exception as e:
        # Log the error and return a 500 error
        logger.error(f"Error setting availability rules: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to set availability rules: {str(e)}"
        )

@router.get(
    "/users/{user_id}/availability-rules",
    response_model=List[AvailabilityRule],
    include_in_schema=False # Hide from public docs
)
async def get_user_availability_rules(
    user_id: UUID4,
    db: AsyncSession = Depends(get_async_db)
):
    return await get_availability_rules_for_user(db=db, user_id=user_id)

# In routes.py
@router.get(
    "/users/{user_id}/availability-slots",
    response_model=List[AvailabilitySlotResponse]
)
async def get_user_availability_slots(
    user_id: UUID4,
    start_date: date,
    end_date: date,
    db: AsyncSession = Depends(get_async_db)
):
    """Get available time slots for a user within a date range"""
    # First, ensure slots exist by generating them
    await generate_availability_slots(db, user_id, start_date, end_date)
    
    # Then fetch all available slots
    result = await db.execute(
        select(AvailabilitySlot).where(
            AvailabilitySlot.user_id == user_id,
            AvailabilitySlot.date >= start_date,
            AvailabilitySlot.date <= end_date,
            AvailabilitySlot.is_booked == False
        ).order_by(AvailabilitySlot.date, AvailabilitySlot.start_time)
    )
    
    return result.scalars().all()


# Admin User Verification Endpoints
@router.get("/admin/users/{user_id}/verification-documents", response_model=List[VerificationDocumentResponse])
async def get_user_verification_documents_admin(
    user_id: str,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get verification documents for a specific user (Admin only)
    
    This endpoint is used by the admin verification system to view
    documents uploaded by users with "Client" role for gig verification.
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    try:
        # First verify the user exists
        user = await get_user_by_id(db, user_uuid)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Get verification documents for the user
        documents = await get_documents_by_user(db, user_uuid)
        
        return [
            VerificationDocumentResponse(
                id=str(doc.id),
                user_id=str(doc.user_id),
                document_type=doc.document_type,
                document_url=doc.document_url,
                uploaded_at=doc.uploaded_at
            )
            for doc in documents
        ]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching verification documents: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve verification documents"
        )


@router.patch("/admin/users/{user_id}/verify-as-expert", response_model=UserResponse)
async def verify_user_as_expert_admin(
    user_id: str,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Verify a user as an expert (Admin only)
    
    Changes user role from CLIENT to EXPERT after admin verification.
    Used in the gig verification workflow.
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    try:
        # Get the user with row locking to prevent race conditions
        result = await db.execute(
            select(User).where(User.id == user_uuid).with_for_update()
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check if user is currently a CLIENT
        if user.role != "client":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User is already an {user.role}. Only client users can be verified as experts."
            )
        
        # Update user role to EXPERT
        user.role = "expert"
        user.updated_at = datetime.utcnow()
        
        # Commit the changes
        await db.commit()
        await db.refresh(user)
        
        return UserResponse(
            id=user.id,
            firebase_uid=user.firebase_uid,
            name=user.name,
            email=user.email,
            phone=user.phone,
            role=user.role,
            bio=user.bio,
            profile_image_url=user.profile_image_url,
            location=user.location,
            is_expert=user.is_expert,
            created_at=user.created_at,
            updated_at=user.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during user verification: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify user as expert"
        )


@router.get("/admin/analytics/users", response_model=UserAnalyticsResponse)
async def get_user_analytics(
    user_type: Optional[str] = Query(None, description="Filter by user type (expert, client)"),
    start_date: Optional[str] = Query(None, description="Start date in YYYY-MM-DD format"),
    end_date: Optional[str] = Query(None, description="End date in YYYY-MM-DD format"),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get user analytics data for admin dashboard.
    Returns daily user counts within the specified date range.
    """
    try:
        logger.info(f"Getting user analytics for user_type: {user_type}, date range: {start_date} to {end_date}")
        
        # Get analytics data from database
        analytics_data = await get_user_analytics_data(db, user_type, start_date, end_date)
        
        logger.info(f"Retrieved {len(analytics_data.data)} analytics data points")
        return analytics_data
        
    except Exception as e:
        logger.error(f"Error getting user analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get user analytics: {str(e)}")
