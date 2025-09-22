"""
Quick fix script to replace the problematic database.py file
"""
import os
import shutil

# Get current directory
current_dir = os.path.dirname(__file__)
db_dir = os.path.join(current_dir, 'db')

# File paths
old_file = os.path.join(db_dir, 'database.py')
new_file = os.path.join(db_dir, 'database_new.py')
backup_file = os.path.join(db_dir, 'database_backup.py')

try:
    # Backup the old file
    if os.path.exists(old_file):
        shutil.copy2(old_file, backup_file)
        print("✅ Backed up old database.py")
    
    # Replace with new file
    if os.path.exists(new_file):
        shutil.copy2(new_file, old_file)
        print("✅ Replaced database.py with fixed version")
        
        # Clean up
        os.remove(new_file)
        print("✅ Cleaned up temporary file")
    else:
        print("❌ New database file not found")
    
    print("🎉 Database fix completed!")
    
except Exception as e:
    print(f"❌ Error fixing database file: {e}")

if __name__ == "__main__":
    pass