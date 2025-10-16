#!/bin/bash

echo "🚀 Review Service Database Migration Script"
echo "=========================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your DATABASE_URL"
    exit 1
fi

# Load environment variables
source .env

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not set in .env file!"
    exit 1
fi

echo "📋 Database URL: $DATABASE_URL"
echo ""

# Install dependencies if needed
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Run migrations
echo "🔄 Running database migrations..."
alembic upgrade head

if [ $? -eq 0 ]; then
    echo "✅ Database migration completed successfully!"
    echo ""
    echo "📊 Tables created:"
    echo "  - reviews"
    echo "  - review_helpful"
    echo ""
    echo "🎉 Your review service database is ready!"
else
    echo "❌ Migration failed!"
    exit 1
fi
