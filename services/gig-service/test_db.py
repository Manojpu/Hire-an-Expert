#!/usr/bin/env python3
"""
Test database connection and check data persistence
"""

from app.db.session import engine
from sqlalchemy import text
import traceback

def test_database():
    try:
        with engine.connect() as conn:
            print("✓ Database connection successful")
            
            # Check if gigs table exists
            result = conn.execute(text("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'gigs'"))
            table_exists = result.scalar() > 0
            print(f"✓ Gigs table exists: {table_exists}")
            
            if table_exists:
                # Check if there are any records
                result = conn.execute(text("SELECT COUNT(*) FROM gigs"))
                count = result.scalar()
                print(f"✓ Records in gigs table: {count}")
                
                # Show recent records if any
                if count > 0:
                    result = conn.execute(text("SELECT id, name, expert_id, status, created_at FROM gigs ORDER BY created_at DESC LIMIT 3"))
                    print("Recent gigs:")
                    for row in result:
                        print(f"  ID: {row[0]}, Name: {row[1]}, Expert: {row[2]}, Status: {row[3]}, Created: {row[4]}")
                else:
                    print("✗ No records found in gigs table")
                    
                # Check table schema
                result = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'gigs' ORDER BY ordinal_position"))
                print("\nTable schema:")
                for row in result:
                    print(f"  {row[0]}: {row[1]}")
                    
            else:
                print("✗ Gigs table does not exist - need to run migrations")
                
                # Check what tables do exist
                result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
                tables = [row[0] for row in result]
                print(f"Available tables: {tables}")
        
    except Exception as e:
        print(f"✗ Database connection failed: {str(e)}")
        print("Full error:")
        traceback.print_exc()

if __name__ == "__main__":
    test_database()
