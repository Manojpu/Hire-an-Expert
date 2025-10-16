#!/usr/bin/env python3
"""
Database Reset Script for User Service v2
==========================================
This script drops all existing tables and recreates them from models.py

⚠️  WARNING: This will DELETE ALL DATA in the database!
    Make sure you have a backup before running this script.

Usage:
    python3 reset_database.py
"""

import sys
from database import Base, sync_engine
from models import (
    User, ExpertProfile, Preference, VerificationDocument,
    AvailabilityRule, DateOverride, AvailabilitySlot
)

def reset_database():
    """Drop all tables and recreate them from models."""
    try:
        print("=" * 60)
        print("DATABASE RESET SCRIPT")
        print("=" * 60)
        print("\n⚠️  WARNING: This will DELETE ALL DATA!")
        print(f"Database URL: {sync_engine.url}\n")
        
        # Ask for confirmation
        response = input("Are you sure you want to continue? (type 'yes' to proceed): ")
        if response.lower() != 'yes':
            print("\n❌ Operation cancelled by user.")
            sys.exit(0)
        
        print("\n🗑️  Dropping all tables...")
        Base.metadata.drop_all(bind=sync_engine)
        print("✅ All tables dropped successfully.")
        
        print("\n🔨 Creating tables from models.py...")
        Base.metadata.create_all(bind=sync_engine)
        print("✅ All tables created successfully.")
        
        print("\n📋 Tables created:")
        for table_name in Base.metadata.tables.keys():
            print(f"   - {table_name}")
        
        print("\n" + "=" * 60)
        print("✅ DATABASE RESET COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error during database reset: {e}")
        sys.exit(1)

if __name__ == "__main__":
    reset_database()
