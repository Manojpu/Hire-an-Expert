@echo off
echo Running database migration...
echo.

REM Check if virtual environment exists and activate it
if exist "venv" (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
) else (
    echo Virtual environment not found. Creating one...
    python -m venv venv
    call venv\Scripts\activate.bat
    echo Installing dependencies...
    pip install -r requirements.txt
)

REM Run the migration
echo Running Alembic migration...
alembic upgrade head

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Migration completed successfully!
) else (
    echo.
    echo Migration failed! Check the error messages above.
)

pause 