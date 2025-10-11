@echo off
echo 🐳 Review Service Docker Setup
echo ===============================

echo 📋 Checking Docker installation...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not in PATH!
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo ✅ Docker is installed

REM Check if Docker daemon is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Docker daemon is not running!
    echo.
    echo 🚀 Attempting to start Docker Desktop...
    echo Please wait while Docker Desktop starts up...
    echo.
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    
    echo Waiting for Docker to start (this may take a minute)...
    timeout /t 30 /nobreak >nul
    
    REM Check again
    docker info >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Docker still not running. Please start Docker Desktop manually and try again.
        echo.
        echo Manual steps:
        echo 1. Start Docker Desktop
        echo 2. Wait for it to fully load
        echo 3. Run this script again
        pause
        exit /b 1
    )
)

echo ✅ Docker daemon is running

echo.
echo 🏗️  Building Review Service image...
docker build -t review-service .

if %errorlevel% neq 0 (
    echo ❌ Docker build failed!
    pause
    exit /b 1
)

echo.
echo 🚀 Starting services with Docker Compose...
docker-compose up --build -d

if %errorlevel% neq 0 (
    echo ❌ Failed to start services with docker-compose!
    pause
    exit /b 1
)

echo.
echo ✅ Review Service is starting up!
echo.
echo 📊 Checking service status...
docker-compose ps

echo.
echo 🌐 Service will be available at:
echo   - API: http://localhost:8005
echo   - Documentation: http://localhost:8005/docs
echo   - Health Check: http://localhost:8005/health

echo.
echo 📋 Useful commands:
echo   docker-compose logs -f review-service  # View logs
echo   docker-compose down                    # Stop services
echo   docker-compose restart review-service  # Restart service

echo.
echo 🎉 Setup complete! The service should be ready in a few moments.
echo Press any key to exit...
pause
