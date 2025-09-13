"""Populate sample gigs

Revision ID: 9c839ae160a8
Revises: 721e938a3996
Create Date: 2025-09-14 03:37:46.036286

"""
import uuid
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql.base import UUID

# revision identifiers, used by Alembic.
revision: str = '9c839ae160a8'
down_revision: Union[str, Sequence[str], None] = '721e938a3996'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


categories_table = sa.table(
    "categories",
    sa.column("id", UUID(as_uuid=True)),
    sa.column("slug", sa.String),
)

gigs_table = sa.table(
    "gigs",
    sa.column("id", sa.String(36)),
    sa.column("expert_id", sa.String),
    sa.column("category_id", UUID(as_uuid=True)),
    sa.column("service_description", sa.Text),
    sa.column("hourly_rate", sa.Float),
    sa.column("currency", sa.String), # <-- Added
    sa.column("availability_preferences", sa.Text), # <-- Added
    sa.column("response_time", sa.String), # <-- Added
    sa.column("experience_years", sa.Integer),
    sa.column("status", sa.String),
    sa.column("expertise_areas", sa.ARRAY(sa.String)),
    sa.column("thumbnail_url", sa.String), # <-- Added
)

# Dummy expert IDs to be used for cleanup in downgrade
DUMMY_EXPERT_IDS = [f"expert_seed_{i}" for i in range(10)]


def upgrade() -> None:
    """Populates the gigs table with 10 practical sample records."""
    bind = op.get_bind()

    # 1. Fetch existing categories and create a slug -> id map
    category_results = bind.execute(sa.select(categories_table.c.id, categories_table.c.slug)).fetchall()
    if not category_results:
        raise Exception("Cannot seed gigs because no categories were found. Please seed categories first.")

    category_map = {slug: cat_id for cat_id, slug in category_results}

    # 2. Define a manual list of 10 practical gigs with all required fields
    gigs_to_create = [
        {
            'expert_id': DUMMY_EXPERT_IDS[0], 'category_slug': 'automobile-advice', 'hourly_rate': 2500.00,
            'service_description': 'Comprehensive Engine Diagnostic Check using OBD2 scanners to identify and explain fault codes.',
            'experience_years': 8, 'status': 'ACTIVE', 'currency': 'LKR', 'response_time': '< 12 hours',
            'availability_preferences': 'Weekdays 9am-5pm',
            'expertise_areas': ['Engine Diagnostics', 'ECU Faults', 'Toyota & Honda Specialist'],
            'thumbnail_url': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70'  # Car engine
        },
        {
            'expert_id': DUMMY_EXPERT_IDS[1], 'category_slug': 'tech-it-support', 'hourly_rate': 3000.00,
            'service_description': 'Professional Laptop Virus & Malware Removal. Includes system cleanup and security software installation.',
            'experience_years': 5, 'status': 'ACTIVE', 'currency': 'LKR', 'response_time': '< 24 hours',
            'availability_preferences': 'Flexible',
            'expertise_areas': ['Malware Removal', 'Data Recovery', 'Windows Security'],
            'thumbnail_url': 'https://images.unsplash.com/photo-1518770660439-4636190af475'  # Laptop repair
        },
        {
            'expert_id': DUMMY_EXPERT_IDS[2], 'category_slug': 'home-improvement', 'hourly_rate': 1800.00,
            'service_description': 'Leaky Faucet and Minor Plumbing Repair. Quick and reliable fix for dripping taps and sinks.',
            'experience_years': 12, 'status': 'APPROVED', 'currency': 'LKR', 'response_time': '< 24 hours',
            'availability_preferences': 'Weekends',
            'expertise_areas': ['Plumbing', 'Fixture Installation', 'Leak Detection'],
            'thumbnail_url': 'https://images.unsplash.com/photo-1604328698692-42b5b2b5dc7f'  # Plumbing sink
        },
        {
            'expert_id': DUMMY_EXPERT_IDS[3], 'category_slug': 'financial-consulting', 'hourly_rate': 4500.00,
            'service_description': 'Personal Budget Planning & Debt Management Session. A one-hour consultation to get your finances in order.',
            'experience_years': 10, 'status': 'ACTIVE', 'currency': 'LKR', 'response_time': '< 6 hours',
            'availability_preferences': 'By Appointment',
            'expertise_areas': ['Personal Finance', 'Investment Advice', 'Debt Consolidation'],
            'thumbnail_url': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40'  # Finance chart
        },
        {
            'expert_id': DUMMY_EXPERT_IDS[4], 'category_slug': 'electronic-devices', 'hourly_rate': 2000.00,
            'service_description': 'Smartphone Screen Replacement Service for popular models. Price quoted is for labor only.',
            'experience_years': 4, 'status': 'PENDING', 'currency': 'LKR', 'response_time': '< 24 hours',
            'availability_preferences': 'Any Time',
            'expertise_areas': ['Screen Repair', 'Battery Replacement', 'Mobile Devices'],
            'thumbnail_url': 'https://images.unsplash.com/photo-1510552776732-01acc6dbf1a4'  # Phone screen repair
        },
        {
            'expert_id': DUMMY_EXPERT_IDS[5], 'category_slug': 'home-appliance', 'hourly_rate': 2200.00,
            'service_description': 'Washing Machine Repair for common issues like drainage problems, drum not spinning, and error codes.',
            'experience_years': 9, 'status': 'ACTIVE', 'currency': 'LKR', 'response_time': '< 12 hours',
            'availability_preferences': 'Weekdays',
            'expertise_areas': ['Appliance Repair', 'LG & Samsung', 'Mechanical Faults'],
            'thumbnail_url': 'https://images.unsplash.com/photo-1581574208063-8c3b6d8e1f85'  # Washing machine
        },
        {
            'expert_id': DUMMY_EXPERT_IDS[6], 'category_slug': 'education-career', 'hourly_rate': 3500.00,
            'service_description': 'Professional CV and Resume Review with feedback on formatting, content, and keyword optimization.',
            'experience_years': 7, 'status': 'ACTIVE', 'currency': 'LKR', 'response_time': '< 24 hours',
            'availability_preferences': 'Flexible',
            'expertise_areas': ['Career Coaching', 'Resume Writing', 'LinkedIn Profiles'],
            'thumbnail_url': 'https://images.unsplash.com/photo-1584697964154-d77f8a08a58e'  # Resume writing
        },
        {
            'expert_id': DUMMY_EXPERT_IDS[7], 'category_slug': 'tech-it-support', 'hourly_rate': 2800.00,
            'service_description': 'Home Wi-Fi Network Setup & Troubleshooting. Eliminate dead zones and improve your internet speed.',
            'experience_years': 6, 'status': 'DRAFT', 'currency': 'LKR', 'response_time': '< 6 hours',
            'availability_preferences': 'Evenings & Weekends',
            'expertise_areas': ['Networking', 'Router Configuration', 'Wi-Fi Security'],
            'thumbnail_url': 'https://images.unsplash.com/photo-1581090700227-4c4f50b7a2b4'  # Wi-Fi router
        },
        {
            'expert_id': DUMMY_EXPERT_IDS[8], 'category_slug': 'automobile-advice', 'hourly_rate': 1500.00,
            'service_description': 'Pre-Purchase Car Inspection. A thorough check of a used vehicle before you buy.',
            'experience_years': 15, 'status': 'ACTIVE', 'currency': 'LKR', 'response_time': '< 24 hours',
            'availability_preferences': 'Any Time',
            'expertise_areas': ['Vehicle Inspection', 'Used Car Valuation', 'Mechanical Assessment'],
            'thumbnail_url': 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d'  # Car inspection
        },
        {
            'expert_id': DUMMY_EXPERT_IDS[9], 'category_slug': 'home-improvement', 'hourly_rate': 2000.00,
            'service_description': 'Interior Wall Painting Consultation and Service. Labor for a standard-sized room.',
            'experience_years': 5, 'status': 'APPROVED', 'currency': 'LKR', 'response_time': '< 48 hours',
            'availability_preferences': 'Project-based',
            'expertise_areas': ['Interior Painting', 'Color Consultation', 'Surface Preparation'],
            'thumbnail_url': 'https://images.unsplash.com/photo-1503387762-592deb58ef4e'  # Painting
        }
    ]

    # 3. Prepare the final list for bulk insert, looking up the category_id
    gigs_data = []
    for gig in gigs_to_create:
        slug = gig.pop('category_slug')
        if slug not in category_map:
            print(f"Warning: Category slug '{slug}' not found. Skipping gig.")
            continue

        gig['id'] = str(uuid.uuid4())
        gig['category_id'] = category_map[slug]
        gigs_data.append(gig)

    # 4. Bulk insert the data
    op.bulk_insert(gigs_table, gigs_data)


def downgrade() -> None:
    """Removes the 10 sample gigs."""
    op.execute(
        gigs_table.delete().where(gigs_table.c.expert_id.in_(DUMMY_EXPERT_IDS))
    )