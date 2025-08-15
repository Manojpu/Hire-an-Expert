#!/usr/bin/env python3
"""
Simple script to run Alembic migrations manually.
Run this script from the user-service-v2 directory.
"""

import os
import sys
import subprocess

def run_migration():
    """Run the Alembic migration to update the database"""
    try:
        print("Starting database migration...")
        
        # Check if we're in the right directory
        if not os.path.exists("alembic.ini"):
            print("Error: alembic.ini not found. Please run this script from the user-service-v2 directory.")
            sys.exit(1)
        
        # Run the migration
        print("Running: alembic upgrade head")
        result = subprocess.run(["alembic", "upgrade", "head"], 
                              capture_output=True, text=True, check=True)
        
        print("Migration completed successfully!")
        print("Output:", result.stdout)
        
    except subprocess.CalledProcessError as e:
        print(f"Migration failed with error code {e.returncode}")
        print("Error output:", e.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migration() 