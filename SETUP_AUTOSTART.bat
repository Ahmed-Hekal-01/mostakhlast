@echo off
chcp 65001 >nul 2>&1
title Setup Autostart

echo.
echo  ==========================================
echo   Setting up Mostakhlasat Auto-Start
echo  ==========================================
echo.

:: Windows Startup folder - runs automatically at every login, no admin needed
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "VBS=%~dp0run_hidden.vbs"
set "DEST=%STARTUP%\MostakhlasSat.vbs"

:: Copy the launcher to the Startup folder
copy /y "%VBS%" "%DEST%" >nul 2>&1

if %errorlevel% neq 0 (
    color 0C
    echo  [ERROR] Could not copy the file.
    echo  Make sure the project folder is accessible.
    echo.
    pause
    exit /b 1
)

color 0A
echo  Done!
echo.
echo  The app will now start automatically
echo  every time Windows starts.
echo.
echo  No window will appear - it runs silently
echo  in the background.
echo.
echo  To open the app: http://localhost:3000
echo.
echo  To remove autostart: run REMOVE_AUTOSTART.bat
echo.
pause
