@echo off
chcp 65001 >nul 2>&1
title Remove Autostart

set "DEST=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\MostakhlasSat.vbs"

echo.
echo  Removing Mostakhlasat autostart...
echo.

del "%DEST%" >nul 2>&1

if %errorlevel% equ 0 (
    color 0A
    echo  Done. The app will no longer start automatically.
) else (
    echo  Nothing to remove (autostart was not set up).
)

echo.
echo  You can still open it manually with START.bat
echo.
pause
