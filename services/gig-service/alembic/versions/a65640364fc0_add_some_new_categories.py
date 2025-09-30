"""Add some new categories

Revision ID: a65640364fc0
Revises: 09561f31bbe7
Create Date: 2025-09-14 02:56:41.419283

"""
import uuid
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a65640364fc0'
down_revision: Union[str, Sequence[str], None] = '09561f31bbe7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

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
        {'id': uuid.uuid4(), 'name': 'Electronic Device', 'slug': 'electronic-devices'},
        {'id': uuid.uuid4(), 'name': 'Home Appliance', 'slug': 'home-appliance'},
        {'id': uuid.uuid4(), 'name': 'Education Career', 'slug': 'education-career'},
    ]

    op.bulk_insert(categories_table, initial_categories)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute(
        categories_table.delete().where(
            categories_table.c.slug.in_([
                'electronic-devices',
                'home-appliance',
                'education-career',
            ])
        )
    )

