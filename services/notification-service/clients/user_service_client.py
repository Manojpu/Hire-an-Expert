"""HTTP client helpers for interacting with the User Service."""
from __future__ import annotations

from typing import Any, Dict, Optional
from urllib.parse import urljoin

import logging
import requests

from config import settings


logger = logging.getLogger(__name__)


def _build_url(path: str) -> str:
    base_url = settings.user_service_url.rstrip("/") + "/"
    return urljoin(base_url, path.lstrip("/"))


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a user's details from the User Service."""
    url = _build_url(f"users/{user_id}")

    try:
        response = requests.get(url, timeout=settings.request_timeout_seconds)
    except requests.RequestException as exc:  # pragma: no cover - network failure path
        logger.error("Failed to fetch user %s: %s", user_id, exc)
        return None

    if response.status_code == 200:
        return response.json()

    logger.warning("User service returned %s for user %s", response.status_code, user_id)
    return None
