"""Add missing booking columns

Revision ID: add_missing_columns
Revises: cfcbda170112
Create Date: 2025-10-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import NUMERIC

# revision identifiers, used by Alembic.
revision: str = 'add_missing_columns'
down_revision: Union[str, None] = 'cfcbda170112'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add missing columns to bookings table
    op.add_column('bookings', 
        sa.Column('duration', sa.Integer(), nullable=True, server_default='30'),
        schema='booking_db'
    )
    op.add_column('bookings', 
        sa.Column('amount', NUMERIC(10, 2), nullable=True),
        schema='booking_db'
    )
    op.add_column('bookings', 
        sa.Column('service', sa.String(100), nullable=True, server_default='consultation'),
        schema='booking_db'
    )
    op.add_column('bookings', 
        sa.Column('type', sa.String(100), nullable=True, server_default='standard'),
        schema='booking_db'
    )
    op.add_column('bookings', 
        sa.Column('notes', sa.Text(), nullable=True),
        schema='booking_db'
    )


def downgrade() -> None:
    # Remove the columns
    op.drop_column('bookings', 'notes', schema='booking_db')
    op.drop_column('bookings', 'type', schema='booking_db')
    op.drop_column('bookings', 'service', schema='booking_db')
    op.drop_column('bookings', 'amount', schema='booking_db')
    op.drop_column('bookings', 'duration', schema='booking_db')
