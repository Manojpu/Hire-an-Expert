import psycopg2
from config import settings

def check_expert_table():
    # Use sync database URL
    conn = psycopg2.connect(settings.sync_database_url)
    cursor = conn.cursor()
    
    # Check if expert_profiles table exists
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'expert_profiles';
    """)
    result = cursor.fetchone()
    print(f'ExpertProfile table exists: {result is not None}')
    
    if result:
        print("\nExpertProfile table structure:")
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'expert_profiles' 
            ORDER BY ordinal_position;
        """)
        columns = cursor.fetchall()
        for col in columns:
            print(f'  {col[0]}: {col[1]} (nullable: {col[2]}, default: {col[3]})')
    
    # Check current enum values
    print(f"\nCurrent UserRole enum values:")
    cursor.execute("SELECT unnest(enum_range(NULL::userrole));")
    roles = cursor.fetchall()
    for role in roles:
        print(f"  {role[0]}")
    
    conn.close()

if __name__ == "__main__":
    check_expert_table()
