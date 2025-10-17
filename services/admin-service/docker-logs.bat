@echo off
REM View admin service logs
echo Viewing admin-service logs (Ctrl+C to exit)...
echo.
docker-compose logs -f
