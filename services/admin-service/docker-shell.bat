@echo off
REM Access admin service container shell
echo Opening shell in admin-service container...
docker exec -it admin-service /bin/bash
