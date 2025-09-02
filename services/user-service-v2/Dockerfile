FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run migrations on startup
CMD ["sh", "-c", "python run_migration.py && uvicorn main:app --host 0.0.0.0 --port 8006"]

EXPOSE 8006
