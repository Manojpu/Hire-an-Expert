@echo off
title Hire an Expert - Development Environment Setup

echo.
echo 🚀 Setting up Hire an Expert Microservices Development Environment
echo =================================================================
echo.

:: Check if Node.js is installed
echo [i] Checking prerequisites...
node --version >nul 2>&1
if errorlevel 1 (
    echo [x] Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
) else (
    echo [✓] Node.js found
)

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [x] Python is not installed. Please install Python 3.8+ from https://python.org/
    pause
    exit /b 1
) else (
    echo [✓] Python found
)

:: Install Node.js service dependencies
echo.
echo [i] Installing Node.js service dependencies...

echo [i] Installing API Gateway dependencies...
cd services\api-gateway
call npm install
if errorlevel 1 (
    echo [x] Failed to install API Gateway dependencies
    cd ..\..
    pause
    exit /b 1
)
echo [✓] API Gateway dependencies installed
cd ..\..

echo [i] Installing Message Service dependencies...
cd services\msg-service
call npm install
if errorlevel 1 (
    echo [x] Failed to install Message Service dependencies
    cd ..\..
    pause
    exit /b 1
)
echo [✓] Message Service dependencies installed
cd ..\..

echo [i] Installing Frontend dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo [x] Failed to install Frontend dependencies
    cd ..
    pause
    exit /b 1
)
echo [✓] Frontend dependencies installed
cd ..

:: Install Python service dependencies
echo.
echo [i] Installing Python service dependencies...

:: Check if pip is available
pip --version >nul 2>&1
if errorlevel 1 (
    echo [!] pip not found, trying pip3...
    pip3 --version >nul 2>&1
    if errorlevel 1 (
        echo [x] Neither pip nor pip3 found. Please install pip.
        pause
        exit /b 1
    )
    set PIP_CMD=pip3
) else (
    set PIP_CMD=pip
)

:: Install pipenv for auth service
echo [i] Installing pipenv...
%PIP_CMD% install pipenv

:: Auth Service
echo [i] Installing Auth Service dependencies...
cd services\auth-service
if exist Pipfile (
    call pipenv install
    if errorlevel 1 (
        echo [!] Failed to install Auth Service dependencies with pipenv
    ) else (
        echo [✓] Auth Service dependencies installed
    )
) else (
    echo [!] Pipfile not found in Auth Service
)
cd ..\..

:: Other Python services
for %%s in (gig-service booking-service payment-service) do (
    echo [i] Installing %%s dependencies...
    cd services\%%s
    if exist requirements.txt (
        %PIP_CMD% install -r requirements.txt
        if errorlevel 1 (
            echo [!] Failed to install %%s dependencies
        ) else (
            echo [✓] %%s dependencies installed
        )
    ) else (
        echo [!] requirements.txt not found in %%s
    )
    cd ..\..
)

:: Display startup instructions
echo.
echo 🎉 Setup Complete!
echo ==================
echo.
echo [i] To start the development environment:
echo.
echo Option 1: Docker (Recommended)
echo   docker-compose up --build
echo.
echo Option 2: Development mode (Manual - use separate command prompts)
echo   Terminal 1: cd services\api-gateway ^&^& npm run dev
echo   Terminal 2: cd services\msg-service ^&^& npm run dev
echo   Terminal 3: cd services\auth-service ^&^& pipenv run python main.py
echo   Terminal 4: cd services\gig-service ^&^& python main.py
echo   Terminal 5: cd services\booking-service ^&^& python main.py
echo   Terminal 6: cd services\payment-service ^&^& python -m app.main
echo   Terminal 7: cd frontend ^&^& npm run dev
echo.
echo Option 3: Using npm scripts
echo   npm install concurrently -g
echo   npm run dev
echo.
echo [i] Access points:
echo   🌐 Frontend: http://localhost:3000
echo   🚪 API Gateway: http://localhost:8000
echo   ❤️  Health Check: http://localhost:8000/health
echo.
echo [i] Service ports:
echo   🔐 Auth Service: http://localhost:8001
echo   💼 Gig Service: http://localhost:8002
echo   📅 Booking Service: http://localhost:8003
echo   💳 Payment Service: http://localhost:8004
echo   💬 Message Service: http://localhost:8005
echo.
echo [!] Make sure all services are running before testing the application!
echo.
pause
