@echo off
echo ========================================
echo Opening Shell in API Gateway Container
echo ========================================
echo.
docker-compose exec api-gateway /bin/bash
