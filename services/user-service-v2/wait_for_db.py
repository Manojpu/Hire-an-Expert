#!/usr/bin/env python3
import time
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# Get database connection details from environment variables or use defaults
db_host = os.environ.get("DB_HOST", "db")
db_port = os.environ.get("DB_PORT", "5432")
db_name = os.environ.get("POSTGRES_DB", "user_service_db")
db_user = os.environ.get("POSTGRES_USER", "user_service")
db_password = os.environ.get("POSTGRES_PASSWORD", "user_service_pass")

# Maximum number of attempts
max_attempts = 30
wait_seconds = 2

print(f"Waiting for database {db_host}:{db_port} to become available...")

# Try to connect to the database
for attempt in range(max_attempts):
    try:
        conn = psycopg2.connect(
            host=db_host,
            port=db_port,
            dbname=db_name,
            user=db_user,
            password=db_password
        )
        conn.close()
        print("Database is available! Continuing...")
        exit(0)
    except psycopg2.OperationalError as e:
        print(f"Attempt {attempt+1}/{max_attempts}: Database not yet available. Waiting {wait_seconds} seconds...")
        time.sleep(wait_seconds)

print("Failed to connect to the database after several attempts.")
exit(1)
