@echo off

REM User Service Startup Script for Windows

echo Starting Hire Expert User Service...

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Check if .env file exists
if not exist ".env" (
    echo Creating .env file from template...
    copy env.example .env
    echo Please edit .env file with your configuration before continuing.
    pause
)

REM Run database migrations
echo Running database migrations...
alembic upgrade head

REM Start the service
echo Starting the service...
uvicorn main:app --host 0.0.0.0 --port 8001 --reload 