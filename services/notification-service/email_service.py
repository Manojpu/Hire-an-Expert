"""Email service utilities for sending notifications via SMTP."""

from __future__ import annotations

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from typing import Dict, List

from config import settings


logger = logging.getLogger(__name__)


def _resolve_sender_address() -> str | None:
    """Return the email address to use as the sender."""

    if settings.email_from:
        return settings.email_from

    return settings.email_username


def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Send an email with HTML content to a single recipient."""

    if not settings.email_enabled:
        logger.info("Email delivery disabled. Skipping send to %s", to_email)
        return False

    sender_address = _resolve_sender_address()
    if not sender_address:
        logger.error("Email credentials are not configured; cannot send to %s", to_email)
        return False

    if not settings.email_username or not settings.email_password:
        logger.error("Email username/password missing; cannot send to %s", to_email)
        return False

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = formataddr((settings.email_sender_name, sender_address))
    message["To"] = to_email

    html_part = MIMEText(html_content, "html")
    message.attach(html_part)

    try:
        with smtplib.SMTP(settings.email_host, settings.email_port) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.email_username, settings.email_password)
            server.sendmail(sender_address, [to_email], message.as_string())
    except Exception as exc:  # pragma: no cover - network failure path
        logger.error("Failed to send email to %s: %s", to_email, exc)
        return False

    logger.info("Email sent to %s", to_email)
    return True


def send_bulk_email(to_emails: List[str], subject: str, html_content: str) -> Dict[str, bool]:
    """Send the same email content to multiple recipients."""

    return {email: send_email(email, subject, html_content) for email in to_emails}