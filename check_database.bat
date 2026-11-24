@echo off
title SmartPort AI - SQLite Database Connection Check
color 0A
echo ============================================================
echo   Checking SQLite Database Connection for SmartPort AI
echo ============================================================
echo.
cd /d %~dp0backend
python check_database.py
echo.
pause

