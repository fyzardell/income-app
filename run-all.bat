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

echo.
echo Server sedang dimulai...
echo Website dapat diakses di: http://localhost:5173
echo.
pause

