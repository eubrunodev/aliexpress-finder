@echo off
setlocal
cd /d "%~dp0"
title AliExpress Finder

set "MODE=%~1"
if "%MODE%"=="" set "MODE=start"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup.ps1"
if errorlevel 1 (
  echo.
  echo Setup failed. Fix the error above and run iniciar.bat again.
  pause
  exit /b 1
)

set "PATH=%ProgramFiles%\nodejs;%APPDATA%\npm;%PATH%"
echo.
echo Running: npm run %MODE%
echo.
call npm run %MODE%

echo.
pause
