@echo off
echo ========================================
echo Building and Starting API Gateway
echo ========================================

echo.
echo Step 1: Building Docker image...
docker-compose build

echo.
echo Step 2: Starting container...
docker-compose up -d

echo.
echo Step 3: Showing logs (Ctrl+C to exit, container keeps running)...
docker-compose logs -f

echo.
echo ========================================
echo API Gateway is running!
echo URL: http://localhost:8000
echo Docs: http://localhost:8000/docs
echo ========================================
