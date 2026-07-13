@echo off
title AI Code Bug Detector Launcher
echo ===================================================
echo   AI-BASED CODE BUG DETECTOR - STARTUP LAUNCHER
echo ===================================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python and try again.
    pause
    exit /b
)

:: Check if virtual environment exists, if not create and setup
if not exist .venv (
    echo [INFO] Creating Python Virtual Environment .venv...
    python -m venv .venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create virtual environment!
        pause
        exit /b
    )
    echo [SUCCESS] Virtual environment created successfully.

    :: Activate virtual environment
    echo [INFO] Activating virtual environment...
    call .venv\Scripts\activate.bat

    :: Install dependencies
    echo [INFO] Upgrading pip and installing requirements...
    python -m pip install --upgrade pip
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install requirements!
        pause
        exit /b
    )
    echo [SUCCESS] Dependencies checked and installed.
) else (
    echo [INFO] Found existing virtual environment .venv.
    echo [INFO] Activating virtual environment...
    call .venv\Scripts\activate.bat
)

echo.
echo ===================================================
echo   Starting web server and launching application...
echo ===================================================
echo.

:: Automatically open browser
start http://127.0.0.1:8000

:: Start FastAPI server using uvicorn
uvicorn app.main:app --reload
