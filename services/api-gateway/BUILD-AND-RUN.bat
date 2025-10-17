@echo off
cls
echo ========================================
echo API Gateway - Docker Setup
echo ========================================
echo.

cd /d %~dp0

echo [1/4] Stopping any existing container...
docker-compose down 2>nul
echo.

echo [2/4] Building Docker image (this may take a few minutes)...
docker-compose build
if errorlevel 1 (
    echo ERROR: Failed to build image!
    pause
    exit /b 1
)
echo.

echo [3/4] Starting container...
docker-compose up -d
if errorlevel 1 (
    echo ERROR: Failed to start container!
    pause
    exit /b 1
)
echo.

echo [4/4] Checking container status...
timeout /t 2 /nobreak >nul
docker ps | findstr "api-gateway"
echo.

echo ========================================
echo SUCCESS! API Gateway is running
echo ========================================
echo.
echo API URL:    http://localhost:8000
echo API Docs:   http://localhost:8000/docs
echo Health:     http://localhost:8000/health
echo.
echo To view logs, run: docker-compose logs -f
echo To stop, run: docker-compose down
echo.
pause
