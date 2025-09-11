# test_expert_user.py - Test script to create and check expert users
import asyncio
import psycopg2
from config import settings

def test_expert_functionality():
    """Test expert user functionality"""
    conn = psycopg2.connect(settings.sync_database_url)
    cursor = conn.cursor()
    
    print("=== Testing Expert User Functionality ===\n")
    
    # 1. Check current expert users
    cursor.execute("""
        SELECT id, name, email, role, is_expert 
        FROM users 
        WHERE is_expert = true OR role = 'expert'
        LIMIT 5;
    """)
    experts = cursor.fetchall()
    print(f"Current Expert Users ({len(experts)}):")
    for expert in experts:
        print(f"  - {expert[1]} ({expert[2]}) | Role: {expert[3]} | is_expert: {expert[4]}")
    
    # 2. Check ExpertProfiles
    cursor.execute("""
        SELECT ep.specialization, ep.description, u.name 
        FROM expert_profiles ep
        JOIN users u ON ep.user_id = u.id
        LIMIT 5;
    """)
    profiles = cursor.fetchall()
    print(f"\nExpert Profiles ({len(profiles)}):")
    for profile in profiles:
        print(f"  - {profile[2]}: {profile[0]} - {profile[1][:50]}...")
    
    # 3. Show how new users will be created (with default is_expert = true)
    print(f"\n=== Default Values ===")
    cursor.execute("""
        SELECT column_name, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name IN ('role', 'is_expert');
    """)
    defaults = cursor.fetchall()
    for default in defaults:
        print(f"  {default[0]}: {default[1]}")
    
    conn.close()

if __name__ == "__main__":
    test_expert_functionality()
