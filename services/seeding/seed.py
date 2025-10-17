"""Cross-service database seeding utility.

This module loads curated fixture data from ``services/seeding/data`` and populates
PostgreSQL databases that back the user, gig, booking, and payment microservices.
Run the script from the repository root after the service databases are reachable:

    uvicorn is not required – execute:
        python -m services.seeding.seed

Use ``--dry-run`` to preview the actions without mutating any data.
"""
from __future__ import annotations

import argparse
import csv
import importlib
import json
import logging
import os
import sys
import uuid
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Set, Tuple

from dotenv import dotenv_values
from sqlalchemy import create_engine, select, text
from sqlalchemy.exc import IntegrityError, OperationalError
from sqlalchemy.orm import Session, sessionmaker

# ---------------------------------------------------------------------------
# Repository location awareness
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
REPO_ROOT = BASE_DIR.parent.parent

USER_SERVICE_DIR = REPO_ROOT / "services" / "user-service-v2"
GIG_SERVICE_DIR = REPO_ROOT / "services" / "gig-service"
BOOKING_SERVICE_DIR = REPO_ROOT / "services" / "booking-service"
PAYMENT_SERVICE_DIR = REPO_ROOT / "services" / "payment-service"
REVIEW_SERVICE_DIR = REPO_ROOT / "services" / "review-service"

Review: Optional[Any] = None


@contextmanager
def _temporary_sys_path(path: Path):
    sys.path.insert(0, str(path))
    try:
        yield
    finally:
        try:
            sys.path.remove(str(path))
        except ValueError:
            pass


def _purge_module(prefix: str) -> None:
    to_delete = [name for name in list(sys.modules) if name == prefix or name.startswith(prefix + ".")]
    for name in to_delete:
        sys.modules.pop(name, None)


def _load_review_model(review_db_url: str) -> Optional[Any]:  # pragma: no cover - optional dependency
    review_model_path = REVIEW_SERVICE_DIR / "app" / "models" / "review.py"
    if not review_model_path.exists():
        return None

    previous_url = os.environ.get("DATABASE_URL")
    if not previous_url:
        os.environ["DATABASE_URL"] = review_db_url

    try:
        with _temporary_sys_path(REVIEW_SERVICE_DIR):
            review_models_module = importlib.import_module("app.models.review")
            model = review_models_module.Review
        return model
    except ModuleNotFoundError:
        return None
    finally:
        _purge_module("app")
        if previous_url is None:
            os.environ.pop("DATABASE_URL", None)
        else:
            os.environ["DATABASE_URL"] = previous_url


with _temporary_sys_path(USER_SERVICE_DIR):
    user_models_module = importlib.import_module("models")
    DocumentType = user_models_module.DocumentType
    ExpertProfile = user_models_module.ExpertProfile
    Preference = user_models_module.Preference
    User = user_models_module.User
    UserRole = user_models_module.UserRole
    VerificationDocument = user_models_module.VerificationDocument
_purge_module("models")
_purge_module("database")
_purge_module("config")

with _temporary_sys_path(GIG_SERVICE_DIR):
    gig_models_module = importlib.import_module("app.db.models")
    Category = gig_models_module.Category
    Gig = gig_models_module.Gig
    GigStatus = gig_models_module.GigStatus
_purge_module("app")

with _temporary_sys_path(BOOKING_SERVICE_DIR):
    booking_models_module = importlib.import_module("app.db.models")
    Booking = booking_models_module.Booking
    BookingStatus = booking_models_module.BookingStatus
_purge_module("app")

with _temporary_sys_path(PAYMENT_SERVICE_DIR):
    payment_models_module = importlib.import_module("app.db.models")
    Payment = payment_models_module.Payment
    PaymentStatus = payment_models_module.PaymentStatus
_purge_module("app")


# ---------------------------------------------------------------------------
# Helper data structures
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class UserSeedRecord:
    email: str
    first_login: str
    last_login: str
    firebase_uid: str
    role: str


@dataclass(frozen=True)
class SeededUser:
    id: uuid.UUID
    firebase_uid: str
    email: str
    name: str
    role: UserRole
    specialization: Optional[str]


@dataclass(frozen=True)
class SeededGig:
    id: str
    firebase_uid: str
    category_slug: str
    hourly_rate: float


@dataclass(frozen=True)
class SeededBooking:
    id: uuid.UUID
    gig_id: uuid.UUID
    client_id: uuid.UUID
    status: BookingStatus


# ---------------------------------------------------------------------------
# Environment & configuration helpers
# ---------------------------------------------------------------------------

def _load_env(path: Path) -> Dict[str, str]:
    if not path.exists():
        return {}
    raw = dotenv_values(path)
    cleaned: Dict[str, str] = {}
    for key, value in raw.items():
        if value is None:
            continue
        cleaned[key] = value.strip().strip("\"").strip("\'")
    return cleaned


def _build_session_factory(database_url: str, *, connect_args: Optional[dict] = None) -> sessionmaker:
    engine = create_engine(
        database_url,
        future=True,
        pool_pre_ping=True,
        connect_args=connect_args or {},
    )
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


# ---------------------------------------------------------------------------
# Data file readers
# ---------------------------------------------------------------------------

def _load_user_records() -> List[UserSeedRecord]:
    data_path = BASE_DIR / "data" / "users.csv"
    records: List[UserSeedRecord] = []
    with data_path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            records.append(
                UserSeedRecord(
                    email=row["email"].strip(),
                    first_login=row["first_login"].strip(),
                    last_login=row["last_login"].strip(),
                    firebase_uid=row["firebase_uid"].strip(),
                    role=row["role"].strip().lower(),
                )
            )
    return records


def _load_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


# ---------------------------------------------------------------------------
# Seed routines
# ---------------------------------------------------------------------------

SPECIALIZATIONS = [
    "Cloud Architecture",
    "Mobile Development",
    "Data Science",
    "DevOps Engineering",
    "Product Design",
    "Digital Marketing",
    "AI/ML Consultancy",
]

LOCATIONS = [
    "Colombo, Sri Lanka",
    "Kandy, Sri Lanka",
    "Galle, Sri Lanka",
    "Negombo, Sri Lanka",
    "Jaffna, Sri Lanka",
    "Matara, Sri Lanka",
]


def seed_users(session_factory: sessionmaker, records: Iterable[UserSeedRecord], *, dry_run: bool = False) -> Dict[str, SeededUser]:
    seeded: Dict[str, SeededUser] = {}
    session: Session
    with session_factory() as session:
        for index, record in enumerate(records):
            existing: Optional[User] = (
                session.query(User).filter(User.firebase_uid == record.firebase_uid).one_or_none()
            )
            if existing:
                specialization = None
                if existing.expert_profiles:
                    specialization = existing.expert_profiles[0].specialization
                seeded[record.firebase_uid] = SeededUser(
                    id=existing.id,
                    firebase_uid=existing.firebase_uid,
                    email=existing.email,
                    name=existing.name,
                    role=existing.role,
                    specialization=specialization,
                )
                continue

            try:
                role = UserRole(record.role)
            except ValueError:
                role = UserRole.EXPERT if record.role == "expert" else UserRole.CLIENT

            name = _derive_name(record.email)
            specialization = SPECIALIZATIONS[index % len(SPECIALIZATIONS)] if role != UserRole.CLIENT else None

            user = User(
                firebase_uid=record.firebase_uid,
                name=name,
                email=record.email,
                phone=_deterministic_phone(record.email),
                role=role,
                bio=_compose_bio(name, specialization),
                profile_image_url=f"https://images.hireexperts.dev/avatars/{record.firebase_uid}.jpg",
                location=LOCATIONS[index % len(LOCATIONS)],
                is_expert=role != UserRole.CLIENT,
            )

            if role != UserRole.CLIENT and specialization:
                user.expert_profiles.append(
                    ExpertProfile(
                        specialization=specialization,
                        description=f"{name} specialises in {specialization.lower()} and delivers tailored engagements for clients worldwide.",
                        is_verified=index % 3 == 0,
                    )
                )
                user.verification_documents.append(
                    VerificationDocument(
                        document_type=DocumentType.PROFESSIONAL_LICENSE,
                        document_url=f"https://docs.hireexperts.dev/{record.firebase_uid}/credentials.pdf",
                    )
                )

            for key, value in ("email_notifications", "true"), ("sms_notifications", "false"):
                user.preferences.append(Preference(key=key, value=value))

            session.add(user)
            session.flush()

            seeded[record.firebase_uid] = SeededUser(
                id=user.id,
                firebase_uid=user.firebase_uid,
                email=user.email,
                name=user.name,
                role=user.role,
                specialization=specialization,
            )

        if dry_run:
            session.rollback()
        else:
            session.commit()

    return seeded


def seed_gigs(
    session_factory: sessionmaker,
    experts: Dict[str, SeededUser],
    *,
    dry_run: bool = False,
) -> Dict[str, SeededGig]:
    data = _load_json(BASE_DIR / "data" / "gigs.json")
    categories_payload = data.get("categories", [])
    predefined_gigs = {gig["firebase_uid"]: gig for gig in data.get("gigs", [])}

    seeded: Dict[str, SeededGig] = {}

    with session_factory() as session:
        category_map: Dict[str, Category] = {}
        for payload in categories_payload:
            slug = payload["slug"]
            category = session.query(Category).filter(Category.slug == slug).one_or_none()
            if not category:
                category = Category(name=payload["name"], slug=slug)
                session.add(category)
                session.flush()
            category_map[slug] = category

        if not category_map:
            default_category = Category(name="Software Development", slug="software-development")
            session.add(default_category)
            session.flush()
            category_map[default_category.slug] = default_category

        category_cycle = list(category_map.keys()) or [payload["slug"] for payload in categories_payload]
        if not category_cycle:
            category_cycle = ["software-development"]

        for index, expert in enumerate(user for user in experts.values() if user.role != UserRole.CLIENT):
            gig_payload = predefined_gigs.get(expert.firebase_uid)
            category_slug = (
                gig_payload.get("category") if gig_payload and gig_payload.get("category") in category_map else category_cycle[index % len(category_cycle)]
            )

            existing_row = session.execute(
                select(Gig.id, Gig.hourly_rate).where(Gig.expert_id == expert.firebase_uid)
            ).one_or_none()
            if existing_row:
                gig_id, hourly_rate_existing = existing_row
                seeded[expert.firebase_uid] = SeededGig(
                    id=gig_id,
                    firebase_uid=expert.firebase_uid,
                    category_slug=category_slug,
                    hourly_rate=hourly_rate_existing,
                )
                continue

            if gig_payload:
                hourly_rate = float(gig_payload.get("hourly_rate", 40.0))
                expertise = gig_payload.get("expertise_areas", [])
                experience_years = gig_payload.get("experience_years", 3)
                work_experience = gig_payload.get(
                    "work_experience",
                    f"Hands-on experience delivering {experience_years} projects in {expert.specialization or 'consulting'}.",
                )
                certification = gig_payload.get("certification", [])
                status = GigStatus(gig_payload.get("status", GigStatus.ACTIVE.value))
                service_description = gig_payload.get("service_description", "Expert consulting services.")
            else:
                hourly_rate = 35.0 + (index % 5) * 5
                expertise = [expert.specialization or "Consulting", "Mentoring", "Workshops"]
                experience_years = 4 + (index % 6)
                work_experience = f"Delivered over {experience_years * 3} client engagements focusing on {expert.specialization or 'strategic consulting'}."
                certification = [f"https://certifications.hireexperts.dev/{expert.firebase_uid}/badge-{i+1}.pdf" for i in range(1)]
                status = GigStatus.ACTIVE
                service_description = (
                    f"{expert.name} offers {expert.specialization or 'professional consulting'} with a focus on measurable business outcomes."
                )

            gig = Gig(
                expert_id=expert.firebase_uid,
                category_id=category_map[category_slug].id,
                service_description=service_description,
                hourly_rate=hourly_rate,
                currency="LKR",
                availability_preferences=json.dumps({"timezone": "Asia/Colombo", "days": ["Mon", "Wed", "Fri"]}),
                response_time="< 12 hours",
                thumbnail_url=f"https://images.hireexperts.dev/gigs/{expert.firebase_uid}.jpg",
                expertise_areas=expertise,
                experience_years=experience_years,
                work_experience=work_experience,
                certification=certification,
                status=status,
            )
            session.add(gig)
            session.flush()

            seeded[expert.firebase_uid] = SeededGig(
                id=gig.id,
                firebase_uid=expert.firebase_uid,
                category_slug=category_slug,
                hourly_rate=hourly_rate,
            )

        if dry_run:
            session.rollback()
        else:
            session.commit()

    return seeded


def seed_bookings(
    session_factory: sessionmaker,
    gigs: Dict[str, SeededGig],
    users: Dict[str, SeededUser],
    *,
    dry_run: bool = False,
) -> List[SeededBooking]:
    payload_path = BASE_DIR / "data" / "bookings.json"
    payload = _load_json(payload_path) if payload_path.exists() else {"bookings": []}
    payload_entries = payload.get("bookings", [])

    clients = [user for user in users.values() if user.role == UserRole.CLIENT]
    if not clients:
        logging.warning("No client users available; skipping booking seeding.")
        return []

    gigs_by_uid = {gig.firebase_uid: gig for gig in gigs.values()}
    users_by_email = {user.email.lower(): user for user in users.values()}

    seeded: List[SeededBooking] = []
    used_pairs: Set[Tuple[str, uuid.UUID]] = set()
    start_date = datetime.now(timezone.utc) + timedelta(days=2)

    with session_factory() as session:
        for idx, entry in enumerate(payload_entries):
            firebase_uid = entry.get("gig_firebase_uid")
            client_email = entry.get("client_email", "").lower()
            gig = gigs_by_uid.get(firebase_uid)
            client = users_by_email.get(client_email)

            if not gig or not client or client.role != UserRole.CLIENT:
                logging.warning(
                    "Payload booking %s references unknown gig or non-client user; skipping.",
                    idx,
                )
                continue

            try:
                gig_uuid = uuid.UUID(gig.id)
            except ValueError:
                logging.warning(
                    "Gig %s has a non-UUID identifier; skipping booking seeding for this gig.",
                    gig.id,
                )
                continue

            status_value = entry.get("status", BookingStatus.CONFIRMED.value)
            try:
                status = BookingStatus(status_value)
            except ValueError:
                status = BookingStatus.CONFIRMED

            scheduled_time_raw = entry.get("scheduled_time")
            scheduled_at = (
                _parse_datetime(scheduled_time_raw)
                if scheduled_time_raw
                else start_date + timedelta(days=idx)
            )

            existing = (
                session.query(Booking)
                .filter(Booking.gig_id == gig_uuid, Booking.user_id == client.id)
                .one_or_none()
            )
            if existing:
                seeded.append(
                    SeededBooking(
                        id=existing.id,
                        gig_id=existing.gig_id,
                        client_id=existing.user_id,
                        status=existing.status,
                    )
                )
                used_pairs.add((gig.id, client.id))
                continue

            booking = Booking(
                user_id=client.id,
                gig_id=gig_uuid,
                status=status,
                scheduled_time=scheduled_at,
            )
            session.add(booking)
            session.flush()

            seeded.append(
                SeededBooking(
                    id=booking.id,
                    gig_id=booking.gig_id,
                    client_id=booking.user_id,
                    status=booking.status,
                )
            )
            used_pairs.add((gig.id, client.id))

        base_offset = len(seeded)
        for index, gig in enumerate(gigs.values()):
            client = clients[index % len(clients)]
            if (gig.id, client.id) in used_pairs:
                continue

            scheduled_at = start_date + timedelta(days=base_offset + index)
            status_cycle = [BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.PENDING]
            status = status_cycle[index % len(status_cycle)]

            try:
                gig_uuid = uuid.UUID(gig.id)
            except ValueError:
                logging.warning("Gig %s has a non-UUID identifier; skipping booking seeding for this gig.", gig.id)
                continue

            existing = (
                session.query(Booking)
                .filter(Booking.gig_id == gig_uuid, Booking.user_id == client.id)
                .one_or_none()
            )
            if existing:
                seeded.append(
                    SeededBooking(
                        id=existing.id,
                        gig_id=existing.gig_id,
                        client_id=existing.user_id,
                        status=existing.status,
                    )
                )
                used_pairs.add((gig.id, client.id))
                continue

            booking = Booking(
                user_id=client.id,
                gig_id=gig_uuid,
                status=status,
                scheduled_time=scheduled_at,
            )
            session.add(booking)
            session.flush()

            seeded.append(
                SeededBooking(
                    id=booking.id,
                    gig_id=booking.gig_id,
                    client_id=booking.user_id,
                    status=booking.status,
                )
            )
            used_pairs.add((gig.id, client.id))

        if dry_run:
            session.rollback()
        else:
            session.commit()

    return seeded


def seed_payments(
    session_factory: sessionmaker,
    bookings: Iterable[SeededBooking],
    payment_currency: str,
    *,
    dry_run: bool = False,
) -> None:
    bookings_list = list(bookings)
    if not bookings_list:
        logging.info("No bookings available; skipping payment seeding.")
        return

    with session_factory() as session:
        for index, booking in enumerate(bookings_list):
            existing = session.query(Payment).filter(Payment.booking_id == booking.id).one_or_none()
            if existing:
                continue

            status = (
                PaymentStatus.SUCCEEDED.value
                if booking.status in (BookingStatus.CONFIRMED, BookingStatus.COMPLETED)
                else PaymentStatus.PENDING.value
            )

            amount = 4500 + (index % 5) * 750
            metadata = json.dumps({"source": "seed-script", "index": index})

            payment = Payment(
                booking_id=booking.id,
                payment_intent_id=f"pi_seed_{booking.id.hex}",
                amount=float(amount),
                currency=payment_currency,
                status=status,
                payment_metadata=metadata,
            )
            session.add(payment)

        if dry_run:
            session.rollback()
        else:
            try:
                session.commit()
            except IntegrityError as exc:  # pragma: no cover - defensive
                session.rollback()
                logging.error("Failed to seed payments: %s", exc)
                raise


def seed_reviews(
    session_factory: Optional[sessionmaker],
    review_payload: dict,
    bookings: List[SeededBooking],
    gigs: Dict[str, SeededGig],
    users: Dict[str, SeededUser],
    *,
    dry_run: bool = False,
) -> None:
    if session_factory is None or Review is None:
        logging.info("Review service not configured; skipping review data seeding.")
        return

    booking_lookup = {idx: booking for idx, booking in enumerate(bookings)}
    gig_by_uid = {gig.firebase_uid: gig for gig in gigs.values()}
    user_by_email = {user.email.lower(): user for user in users.values()}

    try:
        with session_factory() as session:
            profiles_table_exists = session.execute(
                text("SELECT to_regclass('profiles') IS NOT NULL")
            ).scalar()
            if not profiles_table_exists:
                logging.warning("profiles table not present in review database; skipping review seeding.")
                return

            for payload in review_payload.get("reviews", []):
                booking_ref = payload.get("booking_reference")
                booking = booking_lookup.get(booking_ref)
                if not booking:
                    logging.warning("Booking reference %s not found for review", booking_ref)
                    continue

                firebase_uid = payload.get("gig_firebase_uid")
                gig = gig_by_uid.get(firebase_uid)
                if not gig:
                    logging.warning("Gig for firebase UID %s not found; skipping review", firebase_uid)
                    continue

                buyer = user_by_email.get(payload.get("buyer_email", "").lower())
                if not buyer:
                    logging.warning("Buyer %s not present in user dataset; skipping review", payload.get("buyer_email"))
                    continue

                review_exists = (
                    session.query(Review)
                    .filter(Review.booking_id == str(booking.id))
                    .one_or_none()
                )
                if review_exists:
                    continue

                review = Review(
                    gig_id=gig.id,
                    booking_id=str(booking.id),
                    buyer_id=str(buyer.id),
                    rating=int(payload.get("rating", 5)),
                    comment=payload.get("comment", ""),
                )
                session.add(review)

            if dry_run:
                session.rollback()
            else:
                try:
                    session.commit()
                except IntegrityError as exc:  # pragma: no cover - defensive
                    session.rollback()
                    logging.error("Failed to seed reviews: %s", exc)
                    raise
    except OperationalError:
        logging.warning("Review database connection failed; skipping review seeding.")


# ---------------------------------------------------------------------------
# Formatting helpers
# ---------------------------------------------------------------------------

def _parse_datetime(value: str) -> datetime:
    try:
        normalized = str(value).strip()
        if normalized.endswith("Z"):
            normalized = normalized[:-1] + "+00:00"
        return datetime.fromisoformat(normalized)
    except Exception:
        logging.warning("Invalid datetime value '%s'; using current UTC timestamp instead.", value)
        return datetime.now(timezone.utc)


def _derive_name(email: str) -> str:
    local_part = email.split("@", 1)[0]
    pieces = [piece for piece in local_part.replace(".", " ").replace("_", " ").split() if piece]
    if not pieces:
        return "User"
    return " ".join(piece.capitalize() for piece in pieces)


def _deterministic_phone(seed: str) -> str:
    digits = uuid.uuid5(uuid.NAMESPACE_DNS, seed).int
    suffix = str(digits)[-7:]
    return f"+94 7{suffix}"


def _compose_bio(name: str, specialization: Optional[str]) -> str:
    if specialization:
        return (
            f"{name} is a seasoned professional in {specialization.lower()} with a passion for delivering "
            f"impactful results and mentoring emerging talent."
        )
    return f"{name} is an engaged member of the Hire an Expert community who collaborates closely with experts."


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed Hire-an-Expert service databases.")
    parser.add_argument("--dry-run", action="store_true", help="Run without committing database changes.")
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose logging.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="[%(levelname)s] %(message)s",
    )

    user_env = _load_env(REPO_ROOT / "services" / "user-service-v2" / ".env")
    gig_env = _load_env(REPO_ROOT / "services" / "gig-service" / ".env")
    booking_env = _load_env(REPO_ROOT / "services" / "booking-service" / ".env")
    payment_env = _load_env(REPO_ROOT / "services" / "payment-service" / ".env")
    review_env = _load_env(REPO_ROOT / "services" / "review-service" / ".env")

    user_db_url = user_env.get("SYNC_DATABASE_URL") or os.getenv("USER_SERVICE_DATABASE_URL")
    if not user_db_url:
        raise RuntimeError("User service database URL not provided.")

    gig_db_url = gig_env.get("DATABASE_URL") or os.getenv("GIG_SERVICE_DATABASE_URL")
    if not gig_db_url:
        raise RuntimeError("Gig service database URL not provided.")

    booking_db_url = booking_env.get("DATABASE_URL") or os.getenv("BOOKING_SERVICE_DATABASE_URL")
    if not booking_db_url:
        raise RuntimeError("Booking service database URL not provided.")

    payment_db_url = payment_env.get("DATABASE_URL") or os.getenv("PAYMENT_SERVICE_DATABASE_URL")
    if not payment_db_url:
        raise RuntimeError("Payment service database URL not provided.")

    review_db_url = (
        review_env.get("DATABASE_URL")
        or os.getenv("REVIEW_SERVICE_DATABASE_URL")
        or "postgresql://review:review123@localhost:5433/review_db"
    )

    user_connect_args = {"sslmode": "require"} if "neon.tech" in user_db_url else {}

    user_session_factory = _build_session_factory(user_db_url, connect_args=user_connect_args)
    gig_session_factory = _build_session_factory(gig_db_url)
    booking_session_factory = _build_session_factory(booking_db_url)
    payment_session_factory = _build_session_factory(payment_db_url)

    global Review
    Review = _load_review_model(review_db_url)

    review_session_factory: Optional[sessionmaker]
    try:
        review_session_factory = _build_session_factory(review_db_url)
    except Exception:  # pragma: no cover - optional dependency
        logging.warning("Review database unreachable – reviews will not be seeded.")
        review_session_factory = None

    user_records = _load_user_records()
    logging.info("Seeding %d user records", len(user_records))
    seeded_users = seed_users(user_session_factory, user_records, dry_run=args.dry_run)

    logging.info("Seeding gigs for %d experts", sum(1 for u in seeded_users.values() if u.role != UserRole.CLIENT))
    seeded_gigs = seed_gigs(gig_session_factory, seeded_users, dry_run=args.dry_run)

    logging.info("Seeding bookings for %d gigs", len(seeded_gigs))
    seeded_bookings = seed_bookings(booking_session_factory, seeded_gigs, seeded_users, dry_run=args.dry_run)

    payment_currency = payment_env.get("CURRENCY", "LKR")
    logging.info("Seeding payments for %d bookings", len(seeded_bookings))
    seed_payments(payment_session_factory, seeded_bookings, payment_currency, dry_run=args.dry_run)

    reviews_payload = _load_json(BASE_DIR / "data" / "reviews.json")
    logging.info("Attempting to seed %d reviews", len(reviews_payload.get("reviews", [])))
    seed_reviews(review_session_factory, reviews_payload, seeded_bookings, seeded_gigs, seeded_users, dry_run=args.dry_run)

    logging.info("Seeding completed%s", " (dry-run)" if args.dry_run else "")


if __name__ == "__main__":
    main()
