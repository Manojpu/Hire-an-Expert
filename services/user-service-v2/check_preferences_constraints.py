#!/usr/bin/env python3
"""
Script to check constraints on the preferences table that might prevent it from being dropped.
"""

import os
import sys
from sqlalchemy import create_engine, text
from config import settings

def check_preferences_constraints():
    """Check constraints on the preferences table"""
    try:
        # Create engine
        engine = create_engine(settings.sync_database_url)
        
        with engine.connect() as conn:
            # Check if preferences table exists
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name = 'preferences'
            """))
            
            if not result.fetchone():
                print("Preferences table does not exist.")
                return
            
            print("Preferences table exists. Checking constraints...")
            
            # Check foreign key constraints
            result = conn.execute(text("""
                SELECT 
                    tc.constraint_name,
                    tc.table_name,
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY' 
                AND tc.table_name = 'preferences'
            """))
            
            print("\nForeign key constraints on preferences table:")
            for row in result:
                print(f"  {row[0]}: {row[1]}.{row[2]} -> {row[3]}.{row[4]}")
            
            # Check if there are any other tables referencing preferences
            result = conn.execute(text("""
                SELECT 
                    tc.constraint_name,
                    tc.table_name,
                    kcu.column_name,
                    ccu.table_name AS referenced_table_name,
                    ccu.column_name AS referenced_column_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY' 
                AND ccu.table_name = 'preferences'
            """))
            
            print("\nTables referencing preferences table:")
            for row in result:
                print(f"  {row[0]}: {row[1]}.{row[2]} -> {row[3]}.{row[4]}")
            
            # Check table structure
            result = conn.execute(text("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'preferences' 
                ORDER BY ordinal_position
            """))
            
            print("\nPreferences table structure:")
            for row in result:
                print(f"  {row[0]}: {row[1]} (nullable: {row[2]}, default: {row[3]})")
                
    except Exception as e:
        print(f"Error checking preferences table: {e}")
        sys.exit(1)

if __name__ == "__main__":
    check_preferences_constraints() 