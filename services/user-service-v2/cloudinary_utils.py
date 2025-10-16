import asyncio
from typing import Optional

import cloudinary
import cloudinary.uploader

from config import settings
import logging

logger = logging.getLogger(__name__)

_CONFIGURED = False


def _configure() -> None:
    required = {
        "cloud_name": settings.cloudinary_cloud_name,
        "api_key": settings.cloudinary_api_key,
        "api_secret": settings.cloudinary_api_secret,
    }
    missing = [name for name, value in required.items() if not value]
    if missing:
        raise RuntimeError(
            "Missing Cloudinary credentials. Set environment variables for "
            + ", ".join(missing)
        )

    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )


def ensure_configured() -> None:
    global _CONFIGURED
    if not _CONFIGURED:
        _configure()
        _CONFIGURED = True
        logger.info("Cloudinary client configured for user service")


async def upload_file(
    *,
    file_bytes: bytes,
    folder: Optional[str] = None,
    public_id: Optional[str] = None,
    resource_type: str = "auto",
) -> str:
    """Upload raw file bytes to Cloudinary and return a secure URL."""
    ensure_configured()

    def _do_upload() -> dict:
        options = {"resource_type": resource_type}
        if folder:
            options["folder"] = folder
        if public_id:
            options["public_id"] = public_id
        return cloudinary.uploader.upload(file_bytes, **options)

    result = await asyncio.to_thread(_do_upload)
    url = result.get("secure_url") or result.get("url")
    if not url:
        raise RuntimeError("Cloudinary upload failed to produce a URL")
    logger.info("Uploaded file to Cloudinary: %s", url)
    return url
