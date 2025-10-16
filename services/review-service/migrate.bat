@echo off
echo 🚀 Review Service Database Migration Script
echo ==========================================

REM Check if .env file exists
if not exist .env (
    echo ❌ Error: .env file not found!
    echo Please create a .env file with your DATABASE_URL
    pause
    exit /b 1
)

echo 📦 Installing dependencies...
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo 🔄 Running database migrations...
alembic upgrade head

if %errorlevel% eq 0 (
    echo.
    echo ✅ Database migration completed successfully!
    echo.
    echo 📊 Tables created:
    echo   - reviews
    echo   - review_helpful
    echo.
    echo 🎉 Your review service database is ready!
) else (
    echo ❌ Migration failed!
    pause
    exit /b 1
)

echo.
echo Press any key to continue...
pause
