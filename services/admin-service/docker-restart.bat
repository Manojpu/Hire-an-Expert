@echo off
REM Restart admin service container
echo Restarting admin-service container...
docker-compose restart
if errorlevel 1 (
    echo [ERROR] Failed to restart container!
    pause
    exit /b 1
)
echo.
echo Admin Service restarted successfully!
echo API: http://localhost:8009
timeout /t 2 /nobreak >nul
docker-compose ps
