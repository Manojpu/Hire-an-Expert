from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, Iterable, Optional

from clients.user_service_client import get_user_by_id
from config import settings
from email_service import send_email


logger = logging.getLogger(__name__)


def _format_datetime(value: Optional[str]) -> str:
    if not value:
        return "TBD"

    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed.strftime("%B %d, %Y at %I:%M %p %Z").strip()
    except ValueError:
        return value


def _build_booking_link(booking_id: Optional[str]) -> Optional[str]:
    if not booking_id or not settings.frontend_base_url:
        return None

    return f"{settings.frontend_base_url.rstrip('/')}/bookings/{booking_id}"


def _build_dashboard_link(path: str = "") -> Optional[str]:
    if not settings.frontend_base_url:
        return None

    cleaned = path.lstrip("/")
    base = settings.frontend_base_url.rstrip("/")
    return f"{base}/{cleaned}" if cleaned else base


def _user_display_name(user: Optional[Dict[str, Any]], fallback: str) -> str:
    if not user:
        return fallback

    return user.get("name") or fallback


def _send_email_to_user(user: Optional[Dict[str, Any]], subject: str, body: str) -> bool:
    if not user:
        return False

    email = user.get("email")
    if not email:
        logger.error("User %s is missing an email address; cannot send notification", user.get("id"))
        return False

    return send_email(email, subject, body)


def _fetch_user(user_id: Optional[str], role: str) -> Optional[Dict[str, Any]]:
    if not user_id:
        logger.error("Missing %s identifier in event payload", role)
        return None

    user = get_user_by_id(user_id)
    if not user:
        logger.error("Failed to fetch %s details for id %s", role, user_id)
    return user


def send_booking_request_to_expert(data: Dict[str, Any]) -> bool:
    booking_id = data.get("booking_id")
    expert = _fetch_user(data.get("expert_id"), "expert")
    client = _fetch_user(data.get("client_id"), "client")

    if not expert:
        return False

    scheduled_time = _format_datetime(data.get("scheduled_time"))
    service_name = data.get("service_name", "a service")
    client_name = _user_display_name(client, "a client")
    booking_link = _build_booking_link(booking_id)

    subject = f"New booking request for {service_name}"
    body_lines = [
        f"<p>Hi {_user_display_name(expert, 'there')},</p>",
        f"<p>{client_name} has requested <strong>{service_name}</strong> on <strong>{scheduled_time}</strong>.</p>",
    ]

    if booking_link:
        body_lines.append(f"<p><a href='{booking_link}'>View booking details</a></p>")

    body_lines.append("<p>Please respond promptly to confirm or decline the request.</p>")

    body = "\n".join(body_lines)

    return _send_email_to_user(expert, subject, body)


def send_booking_confirmation_to_client(data: Dict[str, Any]) -> bool:
    booking_id = data.get("booking_id")
    client = _fetch_user(data.get("client_id"), "client")
    expert = _fetch_user(data.get("expert_id"), "expert")

    if not client:
        return False

    scheduled_time = _format_datetime(data.get("scheduled_time"))
    service_name = data.get("service_name", "your service")
    expert_name = _user_display_name(expert, "the expert")
    booking_link = _build_booking_link(booking_id)

    subject = f"Your booking for {service_name} is confirmed"
    body_lines = [
        f"<p>Hi {_user_display_name(client, 'there')},</p>",
        f"<p>{expert_name} has accepted your booking for <strong>{service_name}</strong>.</p>",
        f"<p>The session is scheduled for <strong>{scheduled_time}</strong>.</p>",
    ]

    if booking_link:
        body_lines.append(f"<p><a href='{booking_link}'>View your booking</a></p>")

    body = "\n".join(body_lines)

    return _send_email_to_user(client, subject, body)


def send_booking_cancellation_notification(data: Dict[str, Any]) -> bool:
    booking_id = data.get("booking_id")
    client = _fetch_user(data.get("client_id"), "client")
    expert = _fetch_user(data.get("expert_id"), "expert")
    reason = data.get("reason", "No reason provided")
    booking_link = _build_booking_link(booking_id)

    scheduled_time = _format_datetime(data.get("scheduled_time"))
    service_name = data.get("service_name", "the booking")

    subject = f"Booking cancelled: {service_name}"

    body_common = [
        f"<p>The booking for <strong>{service_name}</strong> scheduled on <strong>{scheduled_time}</strong> has been cancelled.</p>",
        f"<p>Reason: {reason}</p>",
    ]

    if booking_link:
        body_common.append(f"<p><a href='{booking_link}'>View booking history</a></p>")

    body_common.append("<p>If you have any questions, please contact support.</p>")

    client_body = f"<p>Hi {_user_display_name(client, 'there')},</p>" + "\n".join(body_common)
    expert_body = f"<p>Hi {_user_display_name(expert, 'there')},</p>" + "\n".join(body_common)

    client_sent = _send_email_to_user(client, subject, client_body)
    expert_sent = _send_email_to_user(expert, subject, expert_body)

    return client_sent and expert_sent


def send_booking_reminder(data: Dict[str, Any]) -> bool:
    booking_id = data.get("booking_id")
    client = _fetch_user(data.get("client_id"), "client")
    expert = _fetch_user(data.get("expert_id"), "expert")
    booking_time = _format_datetime(data.get("booking_time"))
    service_name = data.get("service_name", "your session")
    booking_link = _build_booking_link(booking_id)

    subject = f"Reminder: {service_name} on {booking_time}"

    body_lines = [
        f"<p>This is a reminder for your upcoming <strong>{service_name}</strong> scheduled for <strong>{booking_time}</strong>.</p>",
    ]

    if booking_link:
        body_lines.append(f"<p><a href='{booking_link}'>Review booking details</a></p>")

    body_lines.append("<p>Please ensure you are prepared and on time.</p>")
    body = "\n".join(body_lines)

    client_sent = _send_email_to_user(client, subject, f"<p>Hi {_user_display_name(client, 'there')},</p>" + body)
    expert_sent = _send_email_to_user(expert, subject, f"<p>Hi {_user_display_name(expert, 'there')},</p>" + body)

    return client_sent and expert_sent


def send_payment_confirmation(data: Dict[str, Any]) -> bool:
    client = _fetch_user(data.get("client_id"), "client")
    if not client:
        return False

    amount = data.get("amount")
    payment_id = data.get("payment_id")
    booking_id = data.get("booking_id")
    service_name = data.get("service_name", "your booking")
    booking_link = _build_booking_link(booking_id)

    subject = "Payment received"

    body_lines = [
    f"<p>Hi {_user_display_name(client, 'there')},</p>",
        f"<p>We have received your payment for <strong>{service_name}</strong>.</p>",
    ]

    if amount:
        body_lines.append(f"<p>Amount: <strong>{amount}</strong></p>")
    if payment_id:
        body_lines.append(f"<p>Payment reference: {payment_id}</p>")
    if booking_link:
        body_lines.append(f"<p><a href='{booking_link}'>View booking details</a></p>")

    body = "\n".join(body_lines)

    return _send_email_to_user(client, subject, body)


def send_welcome_message(data: Dict[str, Any]) -> bool:
    user = _fetch_user(data.get("user_id"), data.get("user_type", "user"))
    if not user:
        return False

    user_type = data.get("user_type", "user")
    subject = "Welcome to Hire an Expert"

    body = (
    f"<p>Hi {_user_display_name(user, 'there')},</p>"
        f"<p>Welcome to Hire an Expert! Your {user_type} account is ready.</p>"
        "<p>You can now manage your bookings and profile from your dashboard.</p>"
    )

    return _send_email_to_user(user, subject, body)


def send_expert_approval_notification(data: Dict[str, Any]) -> bool:
    user = _fetch_user(data.get("user_id"), "expert")
    if not user:
        return False

    approver = data.get("approved_by") or "The Hire an Expert team"
    specializations: Optional[Iterable[str]] = data.get("specializations")
    if specializations is None:
        profiles = user.get("expert_profiles") or []
        specializations = [profile.get("specialization") for profile in profiles if profile.get("specialization")]

    dashboard_link = _build_dashboard_link("dashboard")

    subject = "Congratulations! Your expert profile is live"

    body_lines = [
        f"<p>Hi {_user_display_name(user, 'there')},</p>",
        "<p>Your expert application has been approved and your profile is now visible to clients.</p>",
    ]

    if specializations:
        specs = ", ".join(sorted({spec for spec in specializations if spec}))
        if specs:
            body_lines.append(f"<p>Featured specializations: <strong>{specs}</strong></p>")

    body_lines.append(
        "<p>Keep your availability up to date so clients can book time with you right away.</p>"
    )

    if dashboard_link:
        body_lines.append(
            f"<p><a href='{dashboard_link}'>Open your expert dashboard</a> to review your profile and manage bookings.</p>"
        )

    if data.get("message"):
        body_lines.append(f"<p>{data['message']}</p>")

    body_lines.append(f"<p>Approved by: {approver}</p>")
    body_lines.append("<p>We are excited to see the impact you will make on the platform.</p>")

    body = "\n".join(body_lines)

    return _send_email_to_user(user, subject, body)