#!/usr/bin/env python3
"""
Database migration script for Gig Service
This script helps manage database schema changes using Alembic
"""

import os
import sys
from alembic.config import Config
from alembic import command
from app.db import models, session

def create_initial_migration():
    """Create the initial migration file"""
    print("Creating initial migration...")
    
    config = Config('alembic.ini')
    command.revision(config, autogenerate=True, message="Initial migration - create gigs table")
    print("✓ Initial migration created!")

def run_migrations():
    """Apply all pending migrations"""
    print("Running database migrations...")
    
    config = Config('alembic.ini')
    command.upgrade(config, "head")
    print("✓ Database migrations completed!")

def create_migration(message):
    """Create a new migration"""
    print(f"Creating migration: {message}")
    
    config = Config('alembic.ini')
    command.revision(config, autogenerate=True, message=message)
    print("✓ Migration created!")

def show_migration_status():
    """Show current migration status"""
    print("Current migration status:")
    
    config = Config('alembic.ini')
    command.current(config)
    command.history(config)

def stamp_database():
    """Mark database as up to date without running migrations"""
    print("Marking database as current...")
    
    config = Config('alembic.ini')
    command.stamp(config, "head")
    print("✓ Database marked as current!")

def reset_database():
    """Reset database (WARNING: This will drop all data!)"""
    print("⚠️  WARNING: This will drop all tables and data!")
    response = input("Are you sure? Type 'yes' to continue: ")
    
    if response.lower() == 'yes':
        print("Dropping all tables...")
        models.Base.metadata.drop_all(bind=session.engine)
        
        print("Creating tables...")
        models.Base.metadata.create_all(bind=session.engine)
        
        print("Marking database as current...")
        config = Config('alembic.ini')
        command.stamp(config, "head")
        
        print("✓ Database reset completed!")
    else:
        print("Reset cancelled.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python migrate.py <command> [args]")
        print("\nAvailable commands:")
        print("  init              - Create initial migration")
        print("  migrate [message] - Create new migration")
        print("  upgrade           - Apply pending migrations")
        print("  status            - Show migration status")
        print("  stamp             - Mark database as current")
        print("  reset             - Reset database (DANGEROUS)")
        print("\nExamples:")
        print("  python migrate.py init")
        print("  python migrate.py migrate 'Add user table'")
        print("  python migrate.py upgrade")
        sys.exit(1)
    
    command_name = sys.argv[1]
    
    try:
        if command_name == "init":
            create_initial_migration()
        elif command_name == "migrate":
            message = sys.argv[2] if len(sys.argv) > 2 else "Auto-generated migration"
            create_migration(message)
        elif command_name == "upgrade":
            run_migrations()
        elif command_name == "status":
            show_migration_status()
        elif command_name == "stamp":
            stamp_database()
        elif command_name == "reset":
            reset_database()
        else:
            print(f"Unknown command: {command_name}")
            sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
