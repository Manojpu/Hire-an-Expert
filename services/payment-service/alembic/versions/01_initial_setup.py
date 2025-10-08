from alembic import op
import sqlalchemy as sa
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text
from sqlalchemy.sql import func
import enum

# Import the PaymentStatus enum from models
from app.db.models import PaymentStatus

# revision identifiers, used by Alembic.
revision = '01_initial_setup'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create the payments table
    op.create_table(
        'payments',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('booking_id', sa.String(length=255), nullable=False),
        sa.Column('payment_intent_id', sa.String(length=255), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False, server_default='LKR'),
        sa.Column('status', sa.Enum(PaymentStatus), nullable=False, server_default=PaymentStatus.PENDING.name),
        sa.Column('metadata', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), onupdate=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('payment_intent_id')
    )
    
    # Create an index on booking_id for faster lookups
    op.create_index(op.f('ix_payments_booking_id'), 'payments', ['booking_id'], unique=False)


def downgrade():
    # Drop the index
    op.drop_index(op.f('ix_payments_booking_id'), table_name='payments')
    
    # Drop the table
    op.drop_table('payments')