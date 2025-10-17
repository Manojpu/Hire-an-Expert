import uuid
from typing import List

from fastapi import UploadFile

from app.utils.cloudinary_client import upload_file
from app.utils.config import settings
from app.utils.logger import get_logger

# Configure logger
logger = get_logger(__name__)

# Allowed file extensions for certificates
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}


def _validate_extension(filename: str) -> None:
    parts = filename.rsplit(".", 1) if filename else []
    extension = f".{parts[1].lower()}" if len(parts) == 2 else ""
    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError(f"File type {extension or 'unknown'} not allowed")


async def save_certificate_files(files: List[UploadFile], gig_id: str) -> List[str]:
    """Upload certificate files for a gig to Cloudinary and return their URLs."""
    saved_urls: List[str] = []
    folder = f"{settings.cloudinary_base_folder}/gigs/{gig_id}".strip("/")
    folder_arg = folder or None

    for file in files:
        if not file.filename:
            continue

        _validate_extension(file.filename)
        contents = await file.read()
        await file.seek(0)

        public_id = f"{gig_id}/{uuid.uuid4()}"
        url = await upload_file(
            file_bytes=contents,
            public_id=public_id,
            folder=folder_arg,
            resource_type="auto",
        )
        saved_urls.append(url)
        logger.info("Uploaded certificate for gig %s to Cloudinary", gig_id)

    return saved_urls


def delete_gig_certificates(gig_id: str) -> bool:
    """Placeholder to maintain backwards compatibility until deletion is supported."""
    logger.info("Deletion of Cloudinary certificates is not yet implemented")
    return True