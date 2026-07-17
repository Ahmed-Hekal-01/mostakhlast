@echo off
chcp 65001 >nul 2>&1
title Remove Autostart

echo.
echo  Removing Mostakhlasat autostart...
echo.

schtasks /delete /tn "MostakhlasSat" /f >nul 2>&1

echo  Done. The app will no longer start automatically.
echo.
echo  You can still open it manually by running START.bat
echo.
pause
