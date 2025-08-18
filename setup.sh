#!/bin/bash

echo "🚀 Setting up Hire-an-Expert Development Environment"
echo "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create necessary directories
mkdir -p ./services/scripts
chmod +x ./services/scripts/init-databases.sh

# Function to check if .env file exists
check_env_file() {
    if [ ! -f "$1/.env" ]; then
        echo "⚠️  Warning: No .env file found in $1"
        echo "Creating default .env file..."
        cp "$1/.env.example" "$1/.env" 2>/dev/null || echo "No .env.example file found"
    fi
}

# Check .env files for all services
check_env_file "./services/auth-service"
check_env_file "./services/gig-service"
check_env_file "./services/booking-service"
check_env_file "./services/msg-service"
check_env_file "./services/payment-service"
check_env_file "./services/api-gateway"

echo "📦 Installing dependencies for all services..."

# Install dependencies for Node.js services
echo "Installing API Gateway dependencies..."
cd ./services/api-gateway && npm install
cd ../msg-service && npm install

# Install dependencies for Python services
echo "Installing Python service dependencies..."
cd ../auth-service && pip install -r requirements.txt
cd ../gig-service && pip install -r requirements.txt
cd ../booking-service && pip install -r requirements.txt
cd ../payment-service && pip install -r requirements.txt

echo "🎉 Setup completed!"
echo "To start all services, run: docker-compose up --build"
echo "To start individual services, navigate to their directories and run their respective start commands"
