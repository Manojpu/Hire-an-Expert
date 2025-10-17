@echo off
REM ============================================
REM Admin Service - Complete Docker Setup
REM ============================================
REM This script will:
REM 1. Stop and remove existing containers
REM 2. Build the Docker image from scratch
REM 3. Start the container
REM 4. Show status
REM ============================================

echo.
echo ============================================
echo  Admin Service - Docker Setup
echo ============================================
echo.

REM Check if docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [1/4] Stopping and removing existing containers...
docker-compose down
if errorlevel 1 (
    echo [WARNING] Error stopping containers, but continuing...
)

echo.
echo [2/4] Building Docker image (this may take a few minutes)...
docker-compose build --no-cache
if errorlevel 1 (
    echo [ERROR] Failed to build Docker image!
    pause
    exit /b 1
)

echo.
echo [3/4] Starting container...
docker-compose up -d
if errorlevel 1 (
    echo [ERROR] Failed to start container!
    pause
    exit /b 1
)

echo.
echo [4/4] Checking status...
timeout /t 3 /nobreak >nul
docker-compose ps

echo.
echo ============================================
echo  Setup Complete!
echo ============================================
echo.
echo Admin Service is now running at:
echo   - API: http://localhost:8009
echo   - Health: http://localhost:8009/health
echo   - Docs: http://localhost:8009/docs
echo.
echo Useful commands:
echo   - View logs:       docker-compose logs -f
echo   - Stop service:    docker-compose stop
echo   - Restart service: docker-compose restart
echo   - Remove all:      docker-compose down
echo.
echo Hot-reload is enabled - changes to main.py and app/ will auto-update!
echo.
pause
