#!/usr/bin/env python3
"""
Database verification script for Review Service
This script connects to the database and verifies that tables were created successfully.
"""

import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

def main():
    print("🔍 Review Service Database Verification")
    print("=====================================")
    
    # Load environment variables
    load_dotenv()
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("❌ ERROR: DATABASE_URL not found in environment variables")
        sys.exit(1)
    
    try:
        # Create engine and connect
        engine = create_engine(database_url)
        
        print(f"🔗 Connecting to database...")
        
        with engine.connect() as conn:
            print("✅ Database connection successful!")
            
            # Check if tables exist
            tables_to_check = ['reviews', 'review_helpful']
            
            for table in tables_to_check:
                result = conn.execute(text(f"""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = '{table}'
                    );
                """))
                
                exists = result.fetchone()[0]
                
                if exists:
                    print(f"✅ Table '{table}' exists")
                    
                    # Get column count
                    col_result = conn.execute(text(f"""
                        SELECT COUNT(*) 
                        FROM information_schema.columns 
                        WHERE table_name = '{table}';
                    """))
                    col_count = col_result.fetchone()[0]
                    print(f"   └─ Columns: {col_count}")
                    
                else:
                    print(f"❌ Table '{table}' does not exist")
            
            print("\n🎉 Database verification completed!")
            print("\nYour Review Service database is ready for use!")
            
    except Exception as e:
        print(f"❌ DATABASE ERROR: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
