"""Initial migration - create reviews and review_helpful tables

Revision ID: 001
Revises: 
Create Date: 2025-10-11 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create reviews table
    op.create_table(
        'reviews',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('gig_id', sa.String(), nullable=False),
        sa.Column('booking_id', sa.String(), nullable=False),
        sa.Column('buyer_id', sa.String(), nullable=False),
        sa.Column('seller_id', sa.String(), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('is_verified', sa.Boolean(), nullable=False, default=False),
        sa.Column('helpful_count', sa.Integer(), nullable=False, default=0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.CheckConstraint('rating >= 1 AND rating <= 5', name='check_rating_range'),
        sa.CheckConstraint('helpful_count >= 0', name='check_helpful_count_positive'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('booking_id')
    )
    
    # Create indexes for reviews table
    op.create_index('ix_reviews_gig_id', 'reviews', ['gig_id'])
    op.create_index('ix_reviews_booking_id', 'reviews', ['booking_id'])
    op.create_index('ix_reviews_buyer_id', 'reviews', ['buyer_id'])
    op.create_index('ix_reviews_seller_id', 'reviews', ['seller_id'])
    
    # Create review_helpful table
    op.create_table(
        'review_helpful',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('review_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['review_id'], ['reviews.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('review_id', 'user_id', name='unique_user_review_helpful')
    )


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('review_helpful')
    op.drop_index('ix_reviews_seller_id', table_name='reviews')
    op.drop_index('ix_reviews_buyer_id', table_name='reviews')
    op.drop_index('ix_reviews_booking_id', table_name='reviews')
    op.drop_index('ix_reviews_gig_id', table_name='reviews')
    op.drop_table('reviews')
