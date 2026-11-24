@echo off
title SmartPort AI Platform Launcher
echo ============================================================
echo   SMARTPORT AI: PORT CONGESTION & LOGISTICS PLATFORM
echo ============================================================
echo Starting Backend (FastAPI + SQLite at http://localhost:8000)...
start "SmartPort AI - Backend" cmd /k "cd /d %~dp0backend && python run_backend.py"

echo Waiting 3 seconds for backend initialization...
timeout /t 3 /nobreak >nul

echo Starting Frontend (React 19 + TanStack Start)...
start "SmartPort AI - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================================
echo   Both services are starting!
echo   - FastAPI Backend & Swagger: http://localhost:8000/docs
echo   - Frontend Application:     http://localhost:8080 (or http://localhost:3000)
echo   - SQLite Database:          backend/data/smartport.db
echo ============================================================
pause

