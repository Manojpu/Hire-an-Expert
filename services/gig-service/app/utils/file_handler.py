import os
import shutil
from typing import List, Optional
import uuid
from fastapi import UploadFile
import aiofiles
from app.utils.logger import get_logger

# Configure logger
logger = get_logger(__name__)

# Define base upload directory
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
CERTIFICATE_DIR = os.path.join(UPLOAD_DIR, "certificates")

# Ensure directories exist
os.makedirs(CERTIFICATE_DIR, exist_ok=True)

# Allowed file extensions for certificates
ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png'}


def get_file_extension(filename: str) -> str:
    """Get the file extension from a filename."""
    return os.path.splitext(filename)[1].lower()


async def save_upload_file(file: UploadFile, directory: str) -> str:
    """
    Asynchronously save an uploaded file to disk.
    
    Args:
        file: The FastAPI UploadFile object
        directory: The directory to save the file to
        
    Returns:
        str: The path where the file was saved (relative to upload directory)
    """
    # Generate a unique filename to prevent collisions
    file_extension = get_file_extension(file.filename)
    if file_extension not in ALLOWED_EXTENSIONS:
        raise ValueError(f"File type {file_extension} not allowed")
    
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(directory, unique_filename)
    
    try:
        # Ensure directory exists
        os.makedirs(directory, exist_ok=True)
        
        # Save file asynchronously
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
        
        logger.info(f"File saved successfully: {file_path}")
        
        # Return the file path relative to the upload directory
        rel_path = os.path.relpath(file_path, UPLOAD_DIR)
        return rel_path
    except Exception as e:
        logger.error(f"Error saving file {file.filename}: {str(e)}")
        raise


async def save_certificate_files(files: List[UploadFile], gig_id: str) -> List[str]:
    """
    Save certificate files for a specific gig.
    
    Args:
        files: List of uploaded certificate files
        gig_id: The ID of the gig these certificates belong to
        
    Returns:
        List[str]: List of saved file paths relative to upload directory
    """
    # Create gig-specific directory
    gig_cert_dir = os.path.join(CERTIFICATE_DIR, gig_id)
    os.makedirs(gig_cert_dir, exist_ok=True)
    
    saved_paths = []
    for file in files:
        if file.filename:
            rel_path = await save_upload_file(file, gig_cert_dir)
            saved_paths.append(rel_path)
    
    logger.info(f"Saved {len(saved_paths)} certificate files for gig {gig_id}")
    return saved_paths


def delete_gig_certificates(gig_id: str) -> bool:
    """
    Delete all certificates associated with a gig.
    
    Args:
        gig_id: The ID of the gig whose certificates should be deleted
        
    Returns:
        bool: True if successful, False otherwise
    """
    gig_cert_dir = os.path.join(CERTIFICATE_DIR, gig_id)
    
    if os.path.exists(gig_cert_dir):
        try:
            shutil.rmtree(gig_cert_dir)
            logger.info(f"Deleted certificate directory for gig {gig_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting certificates for gig {gig_id}: {str(e)}")
            return False
    else:
        logger.warning(f"No certificates found for gig {gig_id}")
        return True  # No certificates to delete is still a success