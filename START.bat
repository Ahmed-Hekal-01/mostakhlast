@echo off
chcp 65001 >nul 2>&1
title Mostakhlasat System
color 0A

echo.
echo  ==========================================
echo   Mostakhlasat - Accounting System
echo  ==========================================
echo.
echo  Starting... Please wait.
echo.

:: Check Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [ERROR] Node.js is NOT installed on this machine!
    echo.
    echo  Please install Node.js from:
    echo  https://nodejs.org
    echo  Choose the LTS version.
    echo.
    echo  After installing, restart and run this file again.
    echo.
    pause
    exit /b 1
)

echo  Node.js found: OK
echo.

:: Always install / update dependencies (fast if nothing changed)
echo  Checking dependencies...
call npm install --silent 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo  [ERROR] Failed to install dependencies.
    echo  Make sure you are connected to the internet for the first run.
    pause
    exit /b 1
)
echo  Dependencies: OK
echo.

:: Build if .next folder is missing (first run or after clean)
if not exist .next (
    echo  Building the app for the first time - this takes about 30 seconds...
    call npm run build
    if %errorlevel% neq 0 (
        color 0C
        echo  [ERROR] Build failed.
        pause
        exit /b 1
    )
    echo  Build: OK
    echo.
)

echo  ==========================================
echo   System is READY!
echo  ==========================================
echo.
echo  Opening browser in a few seconds...
echo  If it does not open, type this in your browser:
echo  http://localhost:3000
echo.
echo  TIP: Run SETUP_AUTOSTART.bat once to make
echo  the app start automatically on every login.
echo.
echo  To stop the system: close this window.
echo.

:: Open browser after 3 seconds
start /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

:: Start the production server
call npm start
