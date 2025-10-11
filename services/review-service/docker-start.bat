@echo off
echo 🚀 Starting Review Service with Docker Compose
echo ==============================================

echo 📦 Building and starting services...
docker-compose up --build -d

if %errorlevel% neq 0 (
    echo ❌ Failed to start services!
    pause
    exit /b 1
)

echo.
echo ✅ Services are starting up...
echo.
echo 📊 Service Status:
docker-compose ps

echo.
echo 🌐 Service URLs:
echo   - Review Service API: http://localhost:8005
echo   - API Documentation: http://localhost:8005/docs
echo   - Health Check: http://localhost:8005/health
echo   - Database: localhost:5435 (review_user/review_pass_123)
echo.
echo 📋 Useful commands:
echo   - View logs: docker-compose logs -f review-service
echo   - Stop services: docker-compose down
echo   - Restart: docker-compose restart review-service
echo.
echo Press any key to continue...
pause
