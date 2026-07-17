@echo off
chcp 65001 >nul 2>&1
title Database Backup
color 0B

echo.
echo  ==========================================
echo   Backup - Mostakhlasat Database
echo  ==========================================
echo.
echo  Creating backup...
echo.

:: Call the backup API (requires the system to be running)
curl -s -X POST http://localhost:3000/api/backup -o backup_result.tmp 2>nul

if %errorlevel% neq 0 (
    color 0C
    echo  [WARNING] Could not reach the system.
    echo  Make sure START.bat is running first, then try again.
    del backup_result.tmp >nul 2>&1
    pause
    exit /b 1
)

findstr /c:"success" backup_result.tmp >nul 2>&1
if %errorlevel% equ 0 (
    color 0A
    echo  Backup saved successfully!
    echo  Location: data\backups\
) else (
    color 0C
    echo  Backup failed. Check that the system is running.
)

del backup_result.tmp >nul 2>&1
echo.
pause
