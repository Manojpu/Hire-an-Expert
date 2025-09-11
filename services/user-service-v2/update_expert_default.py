import psycopg2
from config import settings

def update_expert_default():
    conn = psycopg2.connect(settings.sync_database_url)
    cursor = conn.cursor()
    
    # Update the default value for is_expert column
    cursor.execute('ALTER TABLE users ALTER COLUMN is_expert SET DEFAULT true;')
    conn.commit()
    
    print('✅ Successfully updated is_expert default to TRUE')
    
    # Verify the change
    cursor.execute("""
        SELECT column_name, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_expert';
    """)
    result = cursor.fetchone()
    print(f'Current is_expert default: {result[1]}')
    
    conn.close()

if __name__ == "__main__":
    update_expert_default()
