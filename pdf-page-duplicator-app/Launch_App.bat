@echo off
title PDF Page Duplicator Studio - Pak Parcha AI
color 0b
cls

echo =====================================================================
echo           PDF PAGE DUPLICATOR STUDIO - PAK PARCHA AI
echo =====================================================================
echo.
echo [1/3] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in system PATH!
    echo Please install Python 3.8+ from https://python.org and add it to PATH.
    pause
    exit /b 1
)

echo [2/3] Checking dependencies (PyMuPDF)...
python -c "import pymupdf" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Installing PyMuPDF...
    pip install pymupdf
)

echo [3/3] Launching PDF Page Duplicator Studio...
start "" pythonw "%~dp0app_gui.py"

echo [SUCCESS] App launched successfully!
timeout /t 2 >nul
exit
