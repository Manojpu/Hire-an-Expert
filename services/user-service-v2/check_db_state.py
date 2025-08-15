#!/usr/bin/env python3
"""
Script to check the current database state before running migrations.
"""

import os
import sys
from sqlalchemy import create_engine, text
from config import settings

def check_database_state():
    """Check the current state of the database"""
    try:
        # Create engine
        engine = create_engine(settings.sync_database_url)
        
        with engine.connect() as conn:
            # Check if users table exists and its structure
            result = conn.execute(text("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                ORDER BY ordinal_position
            """))
            
            print("Current users table structure:")
            for row in result:
                print(f"  {row[0]}: {row[1]} (nullable: {row[2]}, default: {row[3]})")
            
            # Check current enum values
            result = conn.execute(text("""
                SELECT unnest(enum_range(NULL::userrole)) as enum_value
            """))
            
            print("\nCurrent userrole enum values:")
            for row in result:
                print(f"  {row[0]}")
            
            # Check if there are any users with EXPERT role
            result = conn.execute(text("""
                SELECT COUNT(*) as expert_count 
                FROM users 
                WHERE role::text = 'EXPERT'
            """))
            
            expert_count = result.fetchone()[0]
            print(f"\nUsers with EXPERT role: {expert_count}")
            
            # Check total user count
            result = conn.execute(text("SELECT COUNT(*) as total_users FROM users"))
            total_users = result.fetchone()[0]
            print(f"Total users: {total_users}")
            
    except Exception as e:
        print(f"Error checking database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    check_database_state() 