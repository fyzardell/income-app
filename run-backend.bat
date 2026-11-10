@echo off
title INCOME - Go Backend API Server (Port 8080)
echo ========================================================
echo   INCOME Coffee & Bakery - Go Backend API Server
echo ========================================================
if exist "C:\laragon\bin\go\bin" set "PATH=C:\laragon\bin\go\bin;%PATH%"
echo Menjalankan Go Backend Server...
cd /d "%~dp0backend"
if not exist server.exe (
  echo Mengompilasi binary server.exe...
  go build -o server.exe ./cmd/server
)
server.exe
pause

