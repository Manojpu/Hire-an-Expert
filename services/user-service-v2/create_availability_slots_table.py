#!/usr/bin/env python3
"""
Script to manually create the availability_slots table.
"""

import asyncio
import os
from sqlalchemy import create_engine, Column, Table, MetaData, UUID, Date, Time, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID

# Import the settings
import sys
sys.path.append(os.path.dirname(__file__))
from config import settings

# Create a synchronous engine for the database operations
engine = create_engine(settings.sync_database_url)
metadata = MetaData()

# Define the availability_slots table
availability_slots = Table(
    'availability_slots',
    metadata,
    Column('id', PostgresUUID(as_uuid=True), primary_key=True),
    Column('user_id', PostgresUUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True),
    Column('date', Date, nullable=False),
    Column('start_time', Time, nullable=False),
    Column('end_time', Time, nullable=False),
    Column('is_booked', Boolean, default=False),
    Column('booking_id', PostgresUUID(as_uuid=True), nullable=True),
    UniqueConstraint('user_id', 'date', 'start_time', 'end_time', name='unique_slot'),
)

def create_table():
    """Create the availability_slots table if it doesn't exist."""
    try:
        # Check if the table exists
        if not engine.dialect.has_table(engine.connect(), "availability_slots"):
            # Create the table
            metadata.create_all(engine, tables=[availability_slots])
            print("Successfully created availability_slots table.")
        else:
            print("Table 'availability_slots' already exists.")
    except Exception as e:
        print(f"Error creating table: {e}")

if __name__ == "__main__":
    create_table()