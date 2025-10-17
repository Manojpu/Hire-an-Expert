@echo off
REM Stop admin service container
echo Stopping admin-service container...
docker-compose stop
echo.
echo Admin Service stopped successfully!
