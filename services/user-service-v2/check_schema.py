import models
from database import sync_engine
from sqlalchemy import inspect

inspector = inspect(sync_engine)
tables = inspector.get_table_names()
print('Tables:', tables)

if 'users' in tables:
    columns = inspector.get_columns('users')
    print('\nUsers table columns:')
    for col in columns:
        print(f'  {col["name"]}: {col["type"]} (nullable: {col["nullable"]})')
else:
    print('Users table not found')
