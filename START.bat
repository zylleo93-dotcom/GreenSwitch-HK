@echo off
echo ========================================
echo   GreenSwitch HK - Quick Start
echo ========================================
echo.

:: 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

:: 进入项目目录
cd /d "D:\GreenSwitch-HK-Enhanced"

:: 检查是否需要安装依赖
if not exist "frontend\node_modules" (
    echo [1/4] Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
) else (
    echo [1/4] Frontend dependencies already installed.
)

if not exist "backend\node_modules" (
    echo [2/4] Installing backend dependencies...
    cd backend
    call npm install
    cd ..
) else (
    echo [2/4] Backend dependencies already installed.
)

echo.
echo [3/4] Starting backend server...
start "GreenSwitch Backend" cmd /k "cd /d D:\GreenSwitch-HK-Enhanced\backend && npm start"

echo [4/4] Starting frontend dev server...
timeout /t 3 /nobreak >nul
start "GreenSwitch Frontend" cmd /k "cd /d D:\GreenSwitch-HK-Enhanced\frontend && npm run dev"

echo.
echo ========================================
echo   Services starting...
echo   - Backend: http://localhost:3001
echo   - Frontend: http://localhost:5173
echo ========================================
echo.
echo Press any key to open the application in browser...
pause >nul
start http://localhost:5173
