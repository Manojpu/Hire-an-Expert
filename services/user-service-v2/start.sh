#!/bin/bash

# User Service Startup Script

echo "Starting Hire Expert User Service..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp env.example .env
    echo "Please edit .env file with your configuration before continuing."
    echo "Press Enter when ready..."
    read
fi

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

# Start the service
echo "Starting the service..."
uvicorn main:app --host 0.0.0.0 --port 8001 --reload 