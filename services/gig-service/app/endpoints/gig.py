from fastapi import APIRouter, Depends, status, HTTPException, Query, File, UploadFile, Form, Body
from app.db import schemas
from sqlalchemy.orm import Session
from fastapi.encoders import jsonable_encoder
import json

from typing import List, Optional
from app.db import crud, session
from app.utils.logger import get_logger
from app.utils.file_handler import save_certificate_files

# Get logger for this module
logger = get_logger(__name__)

router = APIRouter()


@router.post("/", response_model=schemas.Gig, status_code=status.HTTP_201_CREATED)
async def create_new_gig(
    gig: schemas.GigCreate = Depends(schemas.gig_create_form),
    certificate_files: List[UploadFile] = File(None),
    db: Session = Depends(session.get_db),
    current_user_id=Depends(session.get_current_user_id)
):
    """
    Create a new gig with certificate files. Requires Firebase authentication.
    
    - gig: The gig data as a GigCreate model
    - certificate_files: List of certificate files to upload
    """
    try:
        logger.info(f"Creating new gig for expert: {current_user_id}")
        logger.debug(f"Gig data received: {jsonable_encoder(gig)}")
        
        # Convert UUID to string if needed
        expert_id = str(current_user_id)
        
        # Check if category exists before creating gig
        category = crud.get_category(db, str(gig.category_id))
        if not category:
            logger.warning(f"Category with ID {gig.category_id} not found when creating gig for user {expert_id}")
            raise HTTPException(status_code=404, detail=f"Category with ID {gig.category_id} not found")
        
        # Create gig first to get ID (we'll need it for the certificate files)
        db_gig = crud.create_gig(db=db, gig=gig, expert_id=expert_id)
        logger.info(f"Gig created initially with ID: {db_gig.id}")
        
        # Handle certificate files if any were uploaded
        certificate_paths = []
        if certificate_files:
            try:
                # Save the certificate files and get their paths
                certificate_paths = await save_certificate_files(certificate_files, db_gig.id)
                logger.info(f"Saved {len(certificate_paths)} certificate files for gig {db_gig.id}")
                
                # Update the gig with the certificate paths if any were saved
                if certificate_paths:
                    # Update the gig's certification field with the file paths
                    db_gig.certification = certificate_paths
                    db.commit()
                    logger.info(f"Updated gig {db_gig.id} with certificate paths")
            except Exception as e:
                logger.error(f"Error saving certificate files: {str(e)}")
                # Continue with gig creation even if file upload fails
                # We can handle file uploads separately later if needed
        
        # We need to fetch the complete gig with relationship data for the response
        # Because the crud.create_gig doesn't populate the relationship
        complete_gig = crud.get_gig(db=db, gig_id=db_gig.id)
        logger.info(f"Gig creation completed: {db_gig.id}")
        return complete_gig

    except HTTPException:
        # Re-raise HTTP exceptions without modification
        raise
    except ValueError as e:
        logger.error(f"Validation error in create_new_gig for user {current_user_id}: {e}")
        raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")
    except Exception as e:
        logger.error(f"Error in create_new_gig for user {current_user_id}: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to create gig: {str(e)}")


@router.get("/public", response_model=schemas.GigListResponse)
def get_public_gigs(
        category_id: Optional[str] = Query(None),  # Added Optional
        min_rate: Optional[float] = Query(None, ge=0),
        max_rate: Optional[float] = Query(None, ge=0),
        search_query: Optional[str] = Query(None, max_length=100),
        min_experience_years: Optional[int] = Query(None, ge=0),
        page: int = Query(1, ge=1),
        size: int = Query(10, ge=1, le=100),
        db: Session = Depends(session.get_db)
):
    """
    Get public gigs for category/search pages.
    This feeds the Category.tsx component.
    """
    logger.info(f"Fetching public gigs: category_id={category_id}, min_rate={min_rate}, max_rate={max_rate}, search_query={search_query}, min_experience_years={min_experience_years}, page={page}, size={size}")
    filters = schemas.GigFilters(
        category_id=category_id,
        min_rate=min_rate,
        max_rate=max_rate,
        search_query=search_query,
        status=schemas.GigStatus.ACTIVE,  # Only show active gigs
        min_experience_years=min_experience_years
    )

    skip = (page - 1) * size
    gigs = crud.get_gigs_filtered(db=db, filters=filters, skip=skip, limit=size)
    total = crud.get_gigs_count(db=db, filters=filters)
    pages = (total + size - 1) // size
    logger.info(f"Public gigs fetched: count={len(gigs)}, total={total}, pages={pages}")
    return schemas.GigListResponse(
        gigs=gigs,
        total=total,
        page=page,
        size=size,
        pages=pages  # Added missing pages field
    )


@router.get("/{gig_id}", response_model=schemas.GigDetailResponse)
def get_gig_detail(
        gig_id: str,
        db: Session = Depends(session.get_db)
):
    """
    Get a gig by ID.
    """
    logger.info(f"Fetching gig details for gig ID: {gig_id}")
    db_gig = crud.get_gig(db=db, gig_id=gig_id)
    if not db_gig:
        logger.warning(f"Gig not found for gig ID: {gig_id}")
        raise HTTPException(status_code=404, detail="Gig not found")

    # Only show approved/active gigs to public
    if db_gig.status not in [schemas.GigStatus.APPROVED, schemas.GigStatus.ACTIVE]:
        logger.warning(f"Gig with ID {gig_id} is not available (status: {db_gig.status})")
        raise HTTPException(status_code=404, detail="Gig not available")

    logger.info(f"Gig details returned for gig ID: {gig_id}")
    return db_gig


@router.get("/", response_model=List[schemas.Gig])  # Fixed response model
def get_all_gigs(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        db: Session = Depends(session.get_db)
):
    """
    Get all gigs with pagination.
    """
    logger.info(f"Fetching all gigs with skip={skip}, limit={limit}")
    gigs = crud.get_all_gigs(db=db, skip=skip, limit=limit)

    def enrich_gig(gig):
        gig_dict = gig.__dict__.copy() if hasattr(gig, '__dict__') else dict(gig)
        gig_dict["bio"] = "Experienced expert in the field. Contact for more info."
        gig_dict["banner_image_url"] = "/logo.png"
        gig_dict["profile_image_url"] = "/favicon.png"
        gig_dict["name"] = "Expert Name"
        gig_dict["title"] = "Professional Consultant"
        gig_dict["rating"] = "4.8"
        gig_dict["total_reviews"] = "12"
        gig_dict["total_consultations"] = "25"
        return gig_dict

    enriched_gigs = [enrich_gig(g) for g in gigs]
    logger.info(f"All gigs fetched: count={len(enriched_gigs)}")
    return enriched_gigs


@router.get("/expert/{expert_id}", response_model=schemas.Gig)  # New endpoint for expert gigs
def get_gig_by_expert(
        expert_id: str,
        db: Session = Depends(session.get_db)
):
    """
    Get gig by expert Firebase UID.
    Used for expert profile lookups.
    """
    logger.info(f"Fetching gig for expert ID: {expert_id}")
    db_gig = crud.get_gig_by_expert(db=db, expert_id=expert_id)
    if not db_gig:
        logger.warning(f"Expert gig not found for expert ID: {expert_id}")
        raise HTTPException(status_code=404, detail="Expert gig not found")

    if db_gig.status not in [schemas.GigStatus.APPROVED, schemas.GigStatus.ACTIVE]:
        logger.warning(f"Expert profile not available for expert ID: {expert_id} (status: {db_gig.status})")
        raise HTTPException(status_code=404, detail="Expert profile not available")

    logger.info(f"Expert gig returned for expert ID: {expert_id}")
    return db_gig


@router.get("/my/gig", response_model=schemas.GigPrivateResponse)
def get_my_gig(
        db: Session = Depends(session.get_db),
        current_user_id = Depends(session.get_current_user_id)
):
    """
    Get expert's own gig for dashboard management.
    This feeds the ExpertDashboard components.
    """
    # Convert UUID to string if needed
    expert_id = str(current_user_id)
    
    logger.info(f"Fetching gig for current user ID: {expert_id}")
    db_gig = crud.get_gig_by_expert(db=db, expert_id=expert_id)
    if not db_gig:
        logger.warning(f"No gig found for current user ID: {expert_id}")
        raise HTTPException(status_code=404, detail="No gig found for this expert")
    logger.info(f"Gig returned for current user ID: {expert_id}")
    return db_gig


@router.put("/my/gig", response_model=schemas.GigPrivateResponse)
async def update_my_gig(
        gig_update: schemas.GigUpdate = Depends(),
        certificate_files: List[UploadFile] = File(None),
        db: Session = Depends(session.get_db),
        current_user_id = Depends(session.get_current_user_id)
):
    """
    Update expert's own gig.
    """
    # Convert UUID to string if needed
    expert_id = str(current_user_id)
    
    # First get the gig to ensure it belongs to the current user
    logger.info(f"Updating gig for current user ID: {expert_id}")
    logger.debug(f"Gig update data: {jsonable_encoder(gig_update)}")
    
    db_gig = crud.get_gig_by_expert(db=db, expert_id=expert_id)
    if not db_gig:
        logger.warning(f"No gig found for current user ID: {expert_id}")
        raise HTTPException(status_code=404, detail="No gig found for this expert")

    updated_gig = crud.update_gig(db=db, gig_id=db_gig.id, gig_update=gig_update)
    if not updated_gig:
        logger.error(f"Failed to update gig for current user ID: {expert_id}")
        raise HTTPException(status_code=404, detail="Failed to update gig")
    
    # Handle certificate files if any were uploaded
    if certificate_files:
        try:
            # Save the certificate files and get their paths
            certificate_paths = await save_certificate_files(certificate_files, updated_gig.id)
            logger.info(f"Saved {len(certificate_paths)} certificate files for gig {updated_gig.id}")
            
            # Update the gig with the certificate paths if any were saved
            if certificate_paths:
                # Get existing certificates if any
                existing_certs = updated_gig.certification or []
                
                # Add new certificate paths to existing ones
                updated_gig.certification = existing_certs + certificate_paths
                db.commit()
                logger.info(f"Updated gig {updated_gig.id} with certificate paths")
        except Exception as e:
            logger.error(f"Error saving certificate files during update: {str(e)}")
            # Continue with gig update even if file upload fails
            # We can handle file uploads separately later if needed

    logger.info(f"Gig updated for current user ID: {expert_id}")
    return updated_gig


@router.delete("/my/gig", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_gig(
        db: Session = Depends(session.get_db),
        current_user_id = Depends(session.get_current_user_id)
):
    """
    Delete expert's own gig.
    """
    # Convert UUID to string if needed
    expert_id = str(current_user_id)
    
    # First get the gig to ensure it belongs to the current user
    logger.info(f"Deleting gig for current user ID: {expert_id}")
    db_gig = crud.get_gig_by_expert(db=db, expert_id=expert_id)
    if not db_gig:
        logger.warning(f"No gig found for current user ID: {expert_id}")
        raise HTTPException(status_code=404, detail="No gig found for this expert")

    success = crud.delete_gig(db=db, gig_id=db_gig.id)
    if not success:
        logger.error(f"Failed to delete gig for current user ID: {expert_id}")
        raise HTTPException(status_code=500, detail="Failed to delete gig")

    logger.info(f"Gig deleted for current user ID: {expert_id}")
    return None  # 204 No Content response


@router.post("/my/gig/certificates", response_model=schemas.GigPrivateResponse)
async def upload_certificates(
    certificate_files: List[UploadFile] = File(...),
    db: Session = Depends(session.get_db),
    current_user_id = Depends(session.get_current_user_id)
):
    """
    Upload certificate files for the expert's gig.
    This endpoint is specifically for adding certificates to an existing gig.
    """
    # Convert UUID to string if needed
    expert_id = str(current_user_id)
    
    # First get the gig to ensure it exists and belongs to the current user
    logger.info(f"Uploading certificates for expert ID: {expert_id}")
    db_gig = crud.get_gig_by_expert(db=db, expert_id=expert_id)
    if not db_gig:
        logger.warning(f"No gig found for current user ID: {expert_id}")
        raise HTTPException(status_code=404, detail="No gig found for this expert")
    
    if not certificate_files:
        raise HTTPException(status_code=400, detail="No certificate files provided")
    
    try:
        # Save the certificate files and get their paths
        certificate_paths = await save_certificate_files(certificate_files, db_gig.id)
        logger.info(f"Saved {len(certificate_paths)} certificate files for gig {db_gig.id}")
        
        # Update the gig with the certificate paths
        existing_certs = db_gig.certification or []
        db_gig.certification = existing_certs + certificate_paths
        db.commit()
        db.refresh(db_gig)
        
        logger.info(f"Updated gig {db_gig.id} with new certificate paths")
        return db_gig
        
    except Exception as e:
        logger.error(f"Error uploading certificates: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload certificates: {str(e)}")


@router.delete("/my/gig/certificates/{certificate_index}", response_model=schemas.GigPrivateResponse)
async def delete_certificate(
    certificate_index: int,
    db: Session = Depends(session.get_db),
    current_user_id = Depends(session.get_current_user_id)
):
    """
    Delete a specific certificate from the expert's gig by index.
    """
    # Convert UUID to string if needed
    expert_id = str(current_user_id)
    
    # First get the gig to ensure it exists and belongs to the current user
    logger.info(f"Deleting certificate for expert ID: {expert_id} at index {certificate_index}")
    db_gig = crud.get_gig_by_expert(db=db, expert_id=expert_id)
    if not db_gig:
        logger.warning(f"No gig found for current user ID: {expert_id}")
        raise HTTPException(status_code=404, detail="No gig found for this expert")
    
    # Check if certificate exists
    if not db_gig.certification or certificate_index >= len(db_gig.certification):
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    try:
        # Get the certificate path
        certificate_path = db_gig.certification[certificate_index]
        
        # Remove the certificate from the list
        db_gig.certification = [cert for i, cert in enumerate(db_gig.certification) if i != certificate_index]
        db.commit()
        db.refresh(db_gig)
        
        # Try to delete the file (non-blocking)
        try:
            import os
            from app.utils.file_handler import UPLOAD_DIR
            full_path = os.path.join(UPLOAD_DIR, certificate_path)
            if os.path.exists(full_path):
                os.remove(full_path)
                logger.info(f"Deleted certificate file: {full_path}")
        except Exception as file_e:
            # Just log the error, don't fail the request
            logger.warning(f"Could not delete certificate file: {str(file_e)}")
        
        logger.info(f"Removed certificate at index {certificate_index} from gig {db_gig.id}")
        return db_gig
        
    except Exception as e:
        logger.error(f"Error deleting certificate: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete certificate: {str(e)}")


# Admin endpoints for gig verification
@router.get("/admin/pending", response_model=List[schemas.Gig])
def get_pending_gigs_for_admin(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        db: Session = Depends(session.get_db)
):
    """
    Get all gigs with pending status for admin verification.
    """
    logger.info(f"Admin fetching pending gigs: skip={skip}, limit={limit}")
    try:
        pending_gigs = crud.get_pending_gigs(db=db, skip=skip, limit=limit)
        logger.info(f"Retrieved {len(pending_gigs)} pending gigs")
        return pending_gigs
    except Exception as e:
        logger.error(f"Error getting pending gigs: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get pending gigs: {str(e)}")


@router.get("/admin/{gig_id}", response_model=schemas.Gig)
def get_gig_for_admin(
        gig_id: str,
        db: Session = Depends(session.get_db)
):
    """
    Get specific gig details for admin verification.
    Note: This is redundant with the pending endpoint but kept for API compatibility.
    """
    logger.info(f"Admin fetching gig details: {gig_id}")
    try:
        gig = crud.get_gig(db=db, gig_id=gig_id)
        if not gig:
            raise HTTPException(status_code=404, detail="Gig not found")
        return gig
    except Exception as e:
        logger.error(f"Error getting gig details: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get gig details: {str(e)}")


@router.get("/admin/{gig_id}/certificates")
def get_gig_certificates_for_admin(
        gig_id: str,
        db: Session = Depends(session.get_db)
):
    """
    Get certificates for a specific gig for admin verification.
    """
    logger.info(f"Admin fetching certificates for gig: {gig_id}")
    try:
        # First check if gig exists
        gig = crud.get_gig(db=db, gig_id=gig_id)
        if not gig:
            raise HTTPException(status_code=404, detail="Gig not found")
        
        # Get certifications for this gig
        certifications = crud.get_gig_certifications(db=db, gig_id=gig_id)
        
        # Convert to response format
        certificates = []
        for cert in certifications:
            certificates.append({
                "id": str(cert.id),
                "gig_id": cert.gig_id,
                "url": cert.url,
                "thumbnail_url": cert.thumbnail_url,
                "uploaded_at": cert.uploaded_at.isoformat() if cert.uploaded_at else None
            })
        
        logger.info(f"Retrieved {len(certificates)} certificates for gig: {gig_id}")
        return certificates
    except Exception as e:
        logger.error(f"Error getting gig certificates: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get gig certificates: {str(e)}")


@router.get("/admin/categories/{category_id}")
def get_category_for_admin(
        category_id: int,
        db: Session = Depends(session.get_db)
):
    """
    Get category details for admin verification.
    """
    logger.info(f"Admin fetching category: {category_id}")
    try:
        category = crud.get_category(db=db, category_id=str(category_id))
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        return {"id": category.id, "name": category.name, "description": category.description}
    except Exception as e:
        logger.error(f"Error getting category: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get category: {str(e)}")


@router.post("/admin/{gig_id}/approve")
def approve_gig_for_admin(
        gig_id: str,
        db: Session = Depends(session.get_db)
):
    """
    Approve a gig (change status to approved).
    """
    logger.info(f"Admin approving gig: {gig_id}")
    try:
        gig = crud.get_gig(db=db, gig_id=gig_id)
        if not gig:
            raise HTTPException(status_code=404, detail="Gig not found")
        
        # Create a status update object
        from app.db.schemas import GigStatusUpdate
        from app.db.models import GigStatus
        
        status_update = GigStatusUpdate(status=GigStatus.ACTIVE)
        updated_gig = crud.update_gig_status(db=db, gig_id=gig_id, status_update=status_update)
        
        if not updated_gig:
            raise HTTPException(status_code=500, detail="Failed to update gig status")
            
        logger.info(f"Gig {gig_id} approved and activated successfully")
        return {"message": "Gig approved and activated successfully", "gig_id": gig_id}
    except Exception as e:
        logger.error(f"Error approving gig: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to approve gig: {str(e)}")


@router.post("/admin/{gig_id}/reject")
def reject_gig_for_admin(
        gig_id: str,
        db: Session = Depends(session.get_db)
):
    """
    Reject a gig (change status to rejected).
    """
    logger.info(f"Admin rejecting gig: {gig_id}")
    try:
        gig = crud.get_gig(db=db, gig_id=gig_id)
        if not gig:
            raise HTTPException(status_code=404, detail="Gig not found")
        
        # Create a status update object
        from app.db.schemas import GigStatusUpdate
        from app.db.models import GigStatus
        
        status_update = GigStatusUpdate(status=GigStatus.REJECTED)
        updated_gig = crud.update_gig_status(db=db, gig_id=gig_id, status_update=status_update)
        
        if not updated_gig:
            raise HTTPException(status_code=500, detail="Failed to update gig status")
            
        logger.info(f"Gig {gig_id} rejected successfully")
        return {"message": "Gig rejected successfully", "gig_id": gig_id}
    except Exception as e:
        logger.error(f"Error rejecting gig: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reject gig: {str(e)}")


@router.get("/admin/users/{user_id}")
async def get_user_details_for_admin(
        user_id: str,
        db: Session = Depends(session.get_db)
):
    """
    Get user details for admin verification by calling the user service.
    """
    logger.info(f"Admin fetching user details from user service: {user_id}")
    try:
        import httpx
        
        # Call the user service directly
        user_service_url = "http://localhost:8006"  # User service URL
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{user_service_url}/admin/users/{user_id}")
                
                if response.status_code == 200:
                    user_data = response.json()
                    logger.info(f"Successfully retrieved user details for: {user_id}")
                    return user_data
                elif response.status_code == 404:
                    raise HTTPException(status_code=404, detail="User not found")
                else:
                    logger.error(f"User service returned status {response.status_code}: {response.text}")
                    raise HTTPException(status_code=500, detail=f"User service error: {response.status_code}")
                    
            except httpx.RequestError as e:
                logger.error(f"Failed to connect to user service: {e}")
                raise HTTPException(status_code=503, detail="User service unavailable")
                
    except Exception as e:
        logger.error(f"Error getting user details: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get user details: {str(e)}")
