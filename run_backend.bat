@echo off
title SmartPort AI - FastAPI Backend
echo ============================================================
echo Starting SmartPort AI Backend (Python FastAPI + SQLite)
echo ============================================================
cd /d "%~dp0backend"
python run_backend.py
pause

