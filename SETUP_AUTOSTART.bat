@echo off
chcp 65001 >nul 2>&1
title Setup Autostart

echo.
echo  ==========================================
echo   Registering Mostakhlasat Auto-Start
echo  ==========================================
echo.
echo  This will make the app start silently
echo  every time Windows starts.
echo.

:: Use PowerShell to register the Task Scheduler task.
:: Runs at logon, hidden, with highest privileges.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$dir = '%~dp0';" ^
  "$vbs = $dir + 'run_hidden.vbs';" ^
  "$action  = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument \"`\"$vbs`\"\";" ^
  "$trigger = New-ScheduledTaskTrigger -AtLogOn;" ^
  "$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit 0 -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1);" ^
  "Register-ScheduledTask -TaskName 'MostakhlasSat' -Action $action -Trigger $trigger -Settings $settings -RunLevel Highest -Force | Out-Null;" ^
  "Write-Host '  Task registered successfully.'"

if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Registration failed.
    echo  Try right-clicking this file and selecting "Run as administrator".
    echo.
    pause
    exit /b 1
)

echo.
echo  ==========================================
echo   Done!
echo  ==========================================
echo.
echo  The app will now start automatically on every login.
echo  No window will appear - it runs silently.
echo.
echo  To open the app: open your browser and go to
echo  http://localhost:3000
echo.
echo  To stop it: Task Manager - find node.exe - End Task
echo  To remove autostart: run REMOVE_AUTOSTART.bat
echo.
pause
