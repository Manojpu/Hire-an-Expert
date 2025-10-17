@echo off
REM Start admin service container
echo Starting admin-service container...
docker-compose up -d
if errorlevel 1 (
    echo [ERROR] Failed to start container!
    pause
    exit /b 1
)
echo.
echo Admin Service started successfully!
echo API: http://localhost:8009
timeout /t 2 /nobreak >nul
docker-compose ps
