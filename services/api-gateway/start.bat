@echo off

REM FastAPI API Gateway Development Startup Script for Windows

echo 🚀 Starting FastAPI API Gateway...

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📚 Installing dependencies...
pip install -r requirements.txt

REM Create logs directory
if not exist "logs" mkdir logs

REM Copy environment file if it doesn't exist
if not exist ".env" (
    echo ⚙️ Creating environment file...
    copy .env.example .env
    echo ⚠️ Please update .env file with your configuration
)

REM Start the FastAPI server
echo 🌟 Starting FastAPI API Gateway on port 8000...
echo 📋 API Documentation: http://localhost:8000/docs
echo 🔍 Health Check: http://localhost:8000/health
echo.

uvicorn main:app --host 0.0.0.0 --port 8000 --reload

pause
