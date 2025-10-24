"""update_gig_status_enum_values

Revision ID: f6ce1b91e872
Revises: f7240731c4ab
Create Date: 2025-10-24 23:07:40.868122

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f6ce1b91e872'
down_revision: Union[str, Sequence[str], None] = 'f7240731c4ab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # First, update any existing values that don't match the new enum
    # Map old values to new values
    op.execute("UPDATE gigs SET status = 'PENDING' WHERE status IN ('DRAFT', 'PENDING')")
    op.execute("UPDATE gigs SET status = 'ACTIVE' WHERE status IN ('APPROVED', 'ACTIVE')")
    op.execute("UPDATE gigs SET status = 'REJECTED' WHERE status = 'REJECTED'")
    op.execute("UPDATE gigs SET status = 'PENDING' WHERE status = 'INACTIVE'")
    
    # Create the new enum type
    new_enum = sa.Enum('PENDING', 'ACTIVE', 'HOLD', 'REJECTED', name='gigstatus_new')
    new_enum.create(op.get_bind())
    
    # Update the column to use the new enum
    op.execute("ALTER TABLE gigs ALTER COLUMN status TYPE gigstatus_new USING status::text::gigstatus_new")
    
    # Drop the old enum type
    op.execute("DROP TYPE gigstatus")
    
    # Rename the new enum type to the original name
    op.execute("ALTER TYPE gigstatus_new RENAME TO gigstatus")


def downgrade() -> None:
    """Downgrade schema."""
    # Create the old enum type
    old_enum = sa.Enum('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'INACTIVE', name='gigstatus_old')
    old_enum.create(op.get_bind())
    
    # Map new values back to old values
    op.execute("UPDATE gigs SET status = 'PENDING' WHERE status = 'PENDING'")
    op.execute("UPDATE gigs SET status = 'ACTIVE' WHERE status = 'ACTIVE'")
    op.execute("UPDATE gigs SET status = 'REJECTED' WHERE status = 'REJECTED'")
    op.execute("UPDATE gigs SET status = 'INACTIVE' WHERE status = 'HOLD'")
    
    # Update the column to use the old enum
    op.execute("ALTER TABLE gigs ALTER COLUMN status TYPE gigstatus_old USING status::text::gigstatus_old")
    
    # Drop the new enum type
    op.execute("DROP TYPE gigstatus")
    
    # Rename the old enum type back to the original name
    op.execute("ALTER TYPE gigstatus_old RENAME TO gigstatus")
