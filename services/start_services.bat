@echo off
echo Starting Hire-an-Expert Services...
echo.

echo Starting User Service...
cd user-service-v2
start "User Service" cmd /k "python main.py"
cd ..

echo Starting Auth Service...
cd auth-service
start "Auth Service" cmd /k "python main.py"
cd ..

echo.
echo Services started!
echo User Service: http://localhost:8001
echo Auth Service: http://localhost:8000
echo.
echo Press any key to exit...
pause > nul 