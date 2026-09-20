@echo off
setlocal enabledelayedexpansion
title Pak Parcha AI - Universal Notes Hub
color 0B

cd /d "%~dp0"

echo ======================================================================
echo           PAK PARCHA AI - UNIVERSAL NOTES DOWNLOADER HUB
echo              Multi-Class Web Portal (Class 9, 10, 11, 12)
echo ======================================================================
echo.

:: Detect Python
set "PYEXE="
if exist "C:\Program Files\Python312\python.exe" (
    set "PYEXE=C:\Program Files\Python312\python.exe"
) else if exist "C:\Python312\python.exe" (
    set "PYEXE=C:\Python312\python.exe"
) else if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
    set "PYEXE=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
) else (
    for /f "delims=" %%I in ('where python 2^>nul') do (
        if not defined PYEXE set "PYEXE=%%I"
    )
)

if "%PYEXE%"=="" (
    echo [ERROR] Python 3 was not detected on this computer.
    pause
    exit /b 1
)

echo [INFO] Detected Python: "%PYEXE%"

:: Detect Google Chrome
set "CHROME_EXE="
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set "CHROME_EXE=C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set "CHROME_EXE=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_EXE=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_EXE=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
)

echo [INFO] Starting Background Web Server at http://127.0.0.1:5055 ...
start /B "" "%PYEXE%" "%~dp0server.py"

:: Wait 1.5 seconds for server initialization
timeout /t 2 /nobreak >nul

if defined CHROME_EXE (
    echo [INFO] Opening Web Portal in Google Chrome...
    start "" "%CHROME_EXE%" --app="http://127.0.0.1:5055" || start "" "%CHROME_EXE%" "http://127.0.0.1:5055"
) else (
    echo [WARNING] Google Chrome was not found at standard paths. Opening default browser...
    start "" "http://127.0.0.1:5055"
)

echo.
echo ======================================================================
echo Notes Hub is running! Keep this window open while downloading.
echo Web Address: http://127.0.0.1:5055
echo ======================================================================
echo.

pause
