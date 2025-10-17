#!/usr/bin/env python3
"""
Script to completely reset the booking service database.
This will:
1. Drop all tables in the booking_db schema
2. Drop the alembic_version table
3. Recreate all tables from models
4. Initialize alembic with the current migration state
"""

import sys
import os
from pathlib import Path

# Add the parent directory to the path so we can import from app
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text, inspect
from app.core.config import settings
from app.db.models import Base
from app.db.session import engine

def drop_all_tables():
    """Drop all tables in the booking_db schema."""
    print("🗑️  Dropping all tables in booking_db schema...")
    
    with engine.begin() as conn:
        # Drop all tables in booking_db schema
        inspector = inspect(engine)
        tables = inspector.get_table_names(schema='booking_db')
        
        if tables:
            print(f"   Found {len(tables)} tables to drop: {', '.join(tables)}")
            
            # Drop all tables with CASCADE to handle foreign keys
            for table in tables:
                print(f"   Dropping table: booking_db.{table}")
                conn.execute(text(f'DROP TABLE IF EXISTS booking_db."{table}" CASCADE'))
        else:
            print("   No tables found in booking_db schema")
        
        # Also drop alembic_version if it exists
        print("   Dropping alembic_version table if it exists...")
        conn.execute(text('DROP TABLE IF EXISTS booking_db.alembic_version CASCADE'))
    
    print("✅ All tables dropped successfully!\n")

def create_all_tables():
    """Create all tables from SQLAlchemy models."""
    print("🏗️  Creating all tables from models...")
    
    # Create all tables defined in models
    Base.metadata.create_all(bind=engine)
    
    print("✅ All tables created successfully!\n")

def verify_tables():
    """Verify that tables were created correctly."""
    print("🔍 Verifying created tables...")
    
    inspector = inspect(engine)
    tables = inspector.get_table_names(schema='booking_db')
    
    print(f"   Found {len(tables)} tables:")
    for table in sorted(tables):
        columns = inspector.get_columns(table, schema='booking_db')
        print(f"   - {table} ({len(columns)} columns)")
    
    print()

def initialize_alembic():
    """Initialize alembic version table."""
    print("📝 Initializing Alembic...")
    print("   Please run the following command to mark the database as up-to-date:")
    print("   cd /Users/pubudumanojekanayaka/Documents/Hire-an-Expert/services/booking-service")
    print("   alembic stamp head")
    print()

def main():
    """Main function to reset the database."""
    print("=" * 60)
    print("🔄 BOOKING SERVICE DATABASE RESET")
    print("=" * 60)
    print()
    
    print(f"Database URL: {settings.DATABASE_URL}")
    print(f"Schema: booking_db")
    print()
    
    # Ask for confirmation
    response = input("⚠️  WARNING: This will delete ALL data in the booking_db schema!\nAre you sure you want to continue? (yes/no): ")
    
    if response.lower() != 'yes':
        print("❌ Operation cancelled.")
        return
    
    print()
    
    try:
        # Step 1: Drop all tables
        drop_all_tables()
        
        # Step 2: Create all tables
        create_all_tables()
        
        # Step 3: Verify tables
        verify_tables()
        
        # Step 4: Show alembic initialization command
        initialize_alembic()
        
        print("=" * 60)
        print("✅ DATABASE RESET COMPLETE!")
        print("=" * 60)
        print()
        print("Next steps:")
        print("1. Run: alembic stamp head")
        print("2. Start your booking service")
        print()
        
    except Exception as e:
        print(f"❌ Error during database reset: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
