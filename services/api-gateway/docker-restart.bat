@echo off
echo ========================================
echo Restarting API Gateway Container
echo ========================================

echo.
echo Stopping container...
docker-compose down

echo.
echo Rebuilding image...
docker-compose build

echo.
echo Starting container...
docker-compose up -d

echo.
echo Showing logs (Ctrl+C to exit, container keeps running)...
docker-compose logs -f
