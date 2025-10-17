@echo off

echo 🛑 Review Service Container Shutdown Script
echo ===========================================

echo 📋 Current container status:
docker ps --filter "name=review-service" --filter "name=review-db" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo 🛑 Stopping containers...

echo Stopping review service...
docker stop review-service 2>nul || echo Review service not running

echo Stopping database...
docker stop review-db 2>nul || echo Database not running

echo.
echo ✅ Containers stopped!
echo.
echo 💡 To remove containers completely:
echo   docker rm review-service review-db
echo.
echo 💡 To remove network and volumes:
echo   docker network rm review-network
echo   docker volume rm review-service_postgres_data
echo.

pause
