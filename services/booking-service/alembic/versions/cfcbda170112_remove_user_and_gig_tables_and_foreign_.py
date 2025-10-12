"""Remove User and Gig tables and foreign key constraints

Revision ID: cfcbda170112
Revises: b334c7132bef
Create Date: 2025-10-09 04:24:27.225138

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cfcbda170112'
down_revision: Union[str, None] = 'a9d2cfc6de19'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Get the schema name from the schema_translate_map if it exists
    # First drop the foreign key constraints
    op.execute('ALTER TABLE booking_db.bookings DROP CONSTRAINT bookings_user_id_fkey')
    op.execute('ALTER TABLE booking_db.bookings DROP CONSTRAINT bookings_gig_id_fkey')
    
    # Then drop the users and gigs tables
    op.execute('DROP TABLE booking_db.users')
    op.execute('DROP TABLE booking_db.gigs')


def downgrade() -> None:
    # Re-create the tables (this is simplified and may not capture all fields)
    op.create_table('users',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        schema='booking_db'
    )
    
    op.create_table('gigs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        schema='booking_db'
    )
    
    # Re-add the foreign key constraints
    op.create_foreign_key('bookings_user_id_fkey', 'bookings', 'users', ['user_id'], ['id'], schema='booking_db')
    op.create_foreign_key('bookings_gig_id_fkey', 'bookings', 'gigs', ['gig_id'], ['id'], schema='booking_db')
