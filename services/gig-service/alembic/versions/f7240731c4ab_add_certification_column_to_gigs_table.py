"""add_certification_column_to_gigs_table

Revision ID: f7240731c4ab
Revises: 9c839ae160a8
Create Date: 2025-10-08 14:08:14.205337

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f7240731c4ab'
down_revision: Union[str, Sequence[str], None] = '9c839ae160a8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema by adding certification column to gigs table."""
    # Add certification column to gigs table as an array of strings
    op.add_column('gigs',
                 sa.Column('certification', sa.ARRAY(sa.String()), nullable=True))


def downgrade() -> None:
    """Downgrade schema by removing certification column."""
    op.drop_column('gigs', 'certification')
