FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    gcc \
    g++ \
    libpq-dev \
    build-essential \
    pkg-config \
    cmake \
    && rm -rf /var/lib/apt/lists/*

COPY requirements-clean.txt ./requirements.txt

# Upgrade pip and install packages with better wheel handling
RUN pip install --upgrade pip setuptools wheel
RUN pip install --no-cache-dir --prefer-binary -r requirements.txt


COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
