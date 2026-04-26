@echo off
title AI-Legis Legal Intelligence Platform

echo.
echo  ================================================================
echo      AI-LEGIS - Legal Intelligence Agent v1.0
echo      Starting all services...
echo  ================================================================
echo.

set "ROOT=%~dp0"
set "VENV_PY=%ROOT%.venv\Scripts\python.exe"
set "BUNDLED_PY=C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"

if exist "%VENV_PY%" (
    "%VENV_PY%" -c "import sys" >nul 2>&1
    if not errorlevel 1 set "PYTHON=%VENV_PY%"
)

if not defined PYTHON if exist "%BUNDLED_PY%" (
    set "PYTHON=%BUNDLED_PY%"
    set "PYTHONPATH=%ROOT%.venv\Lib\site-packages;%ROOT%backend;%PYTHONPATH%"
)

if not defined PYTHON (
    for %%P in (python py) do (
        if not defined PYTHON (
            %%P --version >nul 2>&1
            if not errorlevel 1 set "PYTHON=%%P"
        )
    )
)

if not defined PYTHON (
    echo  [ERROR] No working Python runtime found.
    echo  The checked-in .venv points to a Python install that is no longer present.
    echo  Install Python 3.12+ or recreate .venv, then run:
    echo      python -m pip install -r backend\requirements.txt
    pause
    exit /b 1
)

echo  [OK] Python: %PYTHON%
echo.

:: Kill any leftover python processes on port 8000
echo  [0/2] Clearing any existing processes on port 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 1 /nobreak >nul

:: Start Backend - run from the backend directory so imports resolve
echo  [1/2] Starting Backend on http://localhost:8000 ...
start "AI-Legis Backend" cmd /k "title AI-Legis Backend && cd /d "%~dp0backend" && echo. && echo [BACKEND] Starting... && "%PYTHON%" -B main.py"

:: Wait for backend to initialise
timeout /t 4 /nobreak >nul

:: Start Frontend
echo  [2/2] Starting Frontend on http://localhost:3000 ...
start "AI-Legis Frontend" cmd /k "title AI-Legis Frontend && cd /d "%~dp0frontend" && npm start"

echo.
echo  ================================================================
echo    Both services launching. Wait 20 seconds then open:
echo.
echo    http://localhost:3000   (App)
echo    http://localhost:8000   (API)
echo  ================================================================
echo.
pause
