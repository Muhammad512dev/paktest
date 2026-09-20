@echo off
setlocal enabledelayedexpansion
title "PDF Notes Cleaner and Re-Brander - Pak Parcha AI"
cd /d "%~dp0"

echo ================================================================
echo    PDF Notes Automation and Re-Brander (Pak Parcha AI)
echo ================================================================
echo.

:: Check python and launch
if exist "C:\Program Files\Python312\python.exe" (
    "C:\Program Files\Python312\python.exe" "app_gui.py"
    goto :done
)

where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    python "app_gui.py"
    goto :done
)

where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    py "app_gui.py"
    goto :done
)

if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
    "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" "app_gui.py"
    goto :done
)

echo [ERROR] Python was not found on your system!
echo Please ensure Python is installed and added to PATH.
echo.

:done
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [EXIT] Program stopped with error code %ERRORLEVEL%.
    pause
)
