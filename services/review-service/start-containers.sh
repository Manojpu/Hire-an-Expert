#!/bin/bash

echo "🚀 Review Service Container Startup Script"
echo "=========================================="

echo "📋 Checking current container status..."
docker ps --filter "name=review-service" --filter "name=review-db"

echo ""
echo "🔍 Checking if containers exist..."
docker ps -a --filter "name=review-service" --filter "name=review-db" --format "table {{.Names}}\t{{.Status}}"

echo ""
echo "🚀 Starting containers..."

# Start database first
echo "📊 Starting database container..."
docker start review-db 2>/dev/null || {
    echo "Creating and starting new database container..."
    docker run -d --name review-db \
        --network review-network \
        -p 5435:5432 \
        -e POSTGRES_USER=review_user \
        -e POSTGRES_PASSWORD=review_pass_123 \
        -e POSTGRES_DB=review_service \
        -v review-service_postgres_data:/var/lib/postgresql/data \
        postgres:15-alpine
}

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Start review service
echo "🔧 Starting review service container..."
docker start review-service 2>/dev/null || {
    echo "Creating and starting new review service container..."
    docker run -d --name review-service \
        --network review-network \
        -p 8005:8005 \
        -e DATABASE_URL=postgresql://review_user:review_pass_123@review-db:5432/review_service \
        -e INTERNAL_JWT_SECRET_KEY=docker-dev-secret-key \
        -e ALGORITHM=HS256 \
        -e BOOKING_SERVICE_URL=http://booking-service:8003 \
        -e GIG_SERVICE_URL=http://gig-service:8004 \
        review-service
}

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 15

echo ""
echo "🔍 Checking service status..."
docker ps --filter "name=review-service" --filter "name=review-db"

echo ""
echo "🏥 Running health checks..."
echo "Testing database connection..."
docker exec review-db pg_isready -U review_user -d review_service

echo ""
echo "Testing API health..."
curl -s http://localhost:8005/health

echo ""
echo "✅ Services are ready!"
echo ""
echo "🌐 Available URLs:"
echo "  - API: http://localhost:8005"
echo "  - Documentation: http://localhost:8005/docs"
echo "  - Health Check: http://localhost:8005/health"
echo "  - Database: localhost:5435"
echo ""
echo "📋 Useful commands:"
echo "  docker logs review-service -f    # View service logs"
echo "  docker logs review-db -f         # View database logs"
echo "  docker exec -it review-service /bin/bash  # Access service container"
echo "  docker exec -it review-db psql -U review_user -d review_service  # Access database"
echo ""
