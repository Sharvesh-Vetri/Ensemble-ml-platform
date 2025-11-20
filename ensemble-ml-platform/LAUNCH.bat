@echo off
setlocal EnableDelayedExpansion

:: Change to script directory
cd /d "%~dp0"

:: Configuration
set "APP_NAME=Ensemble ML Platform"
set "APP_URL=http://localhost:3000"

:: Display header
title %APP_NAME%
echo.
echo =========================================================================
echo  %APP_NAME%
echo =========================================================================
echo.
echo [*] Starting development server...
echo [*] Server will be available at %APP_URL%
echo [*] Press Ctrl+C to stop the server
echo.
echo =========================================================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo [ERROR] Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Check if node_modules exists
if not exist "node_modules\" (
    echo [WARNING] node_modules folder not found!
    echo [*] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
    echo.
)

:: Start development server
echo [*] Launching Next.js development server...
echo.
echo =========================================================================
echo  Ready! Visit: %APP_URL%
echo =========================================================================
echo.

:: Run the dev server (no auto-open browser)
call npm run dev

:: Capture exit code
set "EXIT_CODE=%errorlevel%"

:: Display exit message
echo.
echo =========================================================================
if "%EXIT_CODE%"=="0" (
    echo [*] Development server stopped gracefully
) else (
    echo [ERROR] Development server exited with code %EXIT_CODE%
)
echo =========================================================================
echo.
echo Press any key to close this window...
pause >nul

endlocal
exit /b %EXIT_CODE%
