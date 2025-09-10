import psycopg2
from config import settings

def check_expert_defaults():
    conn = psycopg2.connect(settings.sync_database_url)
    cursor = conn.cursor()
    
    # Check current default value in database
    cursor.execute("""
        SELECT column_default 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_expert';
    """)
    db_default = cursor.fetchone()[0]
    print(f'Database Default for is_expert: {db_default}')
    
    # Check Model default
    from models import User
    is_expert_column = User.__table__.columns['is_expert']
    model_default = is_expert_column.default.arg if is_expert_column.default else None
    print(f'Model Default for is_expert: {model_default}')
    
    # Check ProvisionIn schema default
    from schemas import ProvisionIn
    import inspect
    provision_fields = ProvisionIn.__fields__
    is_expert_field = provision_fields.get('is_expert')
    schema_default = is_expert_field.default if is_expert_field else None
    print(f'ProvisionIn Schema Default for is_expert: {schema_default}')
    
    conn.close()

if __name__ == "__main__":
    check_expert_defaults()
