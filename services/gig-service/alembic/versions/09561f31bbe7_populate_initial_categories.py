"""Populate initial categories

Revision ID: 09561f31bbe7
Revises: d4cfb027bcc2
Create Date: 2025-09-14 01:21:15.227019

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import uuid

# revision identifiers, used by Alembic.
revision: str = '09561f31bbe7'
down_revision: Union[str, Sequence[str], None] = 'd4cfb027bcc2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Define the table structure here to make the script self-contained
# This avoids importing the model directly, which is a good practice for migrations.
categories_table = sa.table(
    "categories",
    sa.column("id", sa.dialects.postgresql.UUID(as_uuid=True)),
    sa.column("name", sa.String),
    sa.column("slug", sa.String),
)


def upgrade() -> None:
    """Inserts the initial category data."""
    # Create a list of categories to insert
    initial_categories = [
        {'id': uuid.uuid4(), 'name': 'Automobile Advice', 'slug': 'automobile-advice'},
        {'id': uuid.uuid4(), 'name': 'Home Improvement', 'slug': 'home-improvement'},
        {'id': uuid.uuid4(), 'name': 'Tech & IT Support', 'slug': 'tech-it-support'},
        {'id': uuid.uuid4(), 'name': 'Financial Consulting', 'slug': 'financial-consulting'},
    ]

    # Use the bulk_insert helper to add the data
    op.bulk_insert(categories_table, initial_categories)


def downgrade() -> None:
    """Removes the initial category data."""
    # The simplest way to downgrade is to delete the specific data you added.
    op.execute(
        categories_table.delete().where(
            categories_table.c.slug.in_([
                'automobile-advice',
                'home-improvement',
                'tech-it-support',
                'financial-consulting',
            ])
        )
    )
