@echo off
title INCOME Coffee & Bakery - Launcher
echo ========================================================
echo   INCOME Coffee & Bakery - Launching Full Stack
echo   - Backend: Go REST API (:8080)
echo   - Frontend: React + Vite (:5173)
echo ========================================================

start "INCOME Backend Server" cmd /k "%~dp0run-backend.bat"
timeout /t 2 /nobreak >nul
start "INCOME Frontend Vite" cmd /k "%~dp0run-frontend.bat"
timeout /t 3 /nobreak >nul

echo.
echo Membuka browser...
start http://localhost:5173

echo.
echo Website dapat diakses di: http://localhost:5173
echo.
pause

