FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Make scripts executable
RUN chmod +x wait_for_db.py run_migration.py

# Wait for database, run migrations on startup, then start the app
CMD ["sh", "-c", "python wait_for_db.py && python run_migration.py && uvicorn main:app --host 0.0.0.0 --port 8006"]

EXPOSE 8006
