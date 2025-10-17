"""
Script to check the actual database schema for the bookings table
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine, inspect
from app.core.config import settings

def check_database_schema():
    """Check the actual columns in the bookings table"""
    print("Connecting to database...")
    
    # Fix the database URL if it has encoding issues
    db_url = settings.DATABASE_URL
    # Fix common encoding issues
    db_url = db_url.replace('%3booki', '%3Dbooki')  # Fix semicolon to equals sign
    print(f"Database URL: {db_url}")
    
    try:
        engine = create_engine(db_url)
        inspector = inspect(engine)
        
        # Check if bookings table exists
        tables = inspector.get_table_names()
        print(f"\n📊 Available tables: {tables}")
        
        if 'bookings' in tables:
            print("\n✅ Bookings table found!")
            print("\n📋 Actual columns in 'bookings' table:")
            print("-" * 80)
            
            columns = inspector.get_columns('bookings')
            for col in columns:
                nullable = "NULL" if col['nullable'] else "NOT NULL"
                default = f", DEFAULT: {col['default']}" if col['default'] else ""
                print(f"  • {col['name']:20} | Type: {col['type']!s:30} | {nullable}{default}")
            
            print("-" * 80)
            print(f"\n📌 Total columns: {len(columns)}")
            
            # Show primary keys
            pk = inspector.get_pk_constraint('bookings')
            print(f"\n🔑 Primary Key: {pk['constrained_columns']}")
            
            # Show foreign keys
            fks = inspector.get_foreign_keys('bookings')
            if fks:
                print(f"\n🔗 Foreign Keys:")
                for fk in fks:
                    print(f"  • {fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}")
            else:
                print("\n🔗 No Foreign Keys")
            
            # Show indexes
            indexes = inspector.get_indexes('bookings')
            if indexes:
                print(f"\n📑 Indexes:")
                for idx in indexes:
                    print(f"  • {idx['name']}: {idx['column_names']}")
            
        else:
            print("\n❌ Bookings table NOT found in database!")
            print("Available tables:", tables)
            
    except Exception as e:
        print(f"\n❌ Error connecting to database: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_database_schema()
