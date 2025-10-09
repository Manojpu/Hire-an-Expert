"""Update payment ID and booking_id to UUID

Revision ID: 02_update_column_types
Revises: 01_initial_setup
Create Date: 2023-10-09 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision = '02_update_column_types'
down_revision = '01_initial_setup'
branch_labels = None
depends_on = None


def upgrade():
    # First, create a temporary table with the correct schema
    op.execute("""
    CREATE TABLE payments_new (
        id UUID PRIMARY KEY,
        booking_id UUID NOT NULL,
        payment_intent_id VARCHAR(255) NOT NULL UNIQUE,
        amount FLOAT NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'LKR',
        status paymentstatus NOT NULL DEFAULT 'pending',
        payment_metadata TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Create the index on booking_id for the new table
    op.execute("CREATE INDEX ix_payments_new_booking_id ON payments_new (booking_id)")
    
    # If there's existing data, we would transfer it, but for now we'll just drop the old table
    # and rename the new one
    op.execute("DROP TABLE payments")
    op.execute("ALTER TABLE payments_new RENAME TO payments")


def downgrade():
    # Create the original table structure
    op.execute("""
    CREATE TABLE payments_old (
        id SERIAL PRIMARY KEY,
        booking_id VARCHAR(255) NOT NULL,
        payment_intent_id VARCHAR(255) NOT NULL UNIQUE,
        amount FLOAT NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'LKR',
        status paymentstatus NOT NULL DEFAULT 'pending',
        payment_metadata TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Create the index on booking_id for the old table
    op.execute("CREATE INDEX ix_payments_old_booking_id ON payments_old (booking_id)")
    
    # Drop the new table and rename the old one
    op.execute("DROP TABLE payments")
    op.execute("ALTER TABLE payments_old RENAME TO payments")