Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  SMARTPORT AI: PORT CONGESTION & LOGISTICS PLATFORM" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

Write-Host "Starting Backend (FastAPI + SQLite at http://localhost:8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; python run_backend.py"

Start-Sleep -Seconds 3

Write-Host "Starting Frontend (React 19 + TanStack Start)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Write-Host "`nBoth services launched!" -ForegroundColor Yellow
Write-Host "  FastAPI Backend & Swagger: http://localhost:8000/docs"
Write-Host "  Frontend Application:     http://localhost:8080 (or http://localhost:3000)"
Write-Host "  SQLite Database:          $root\backend\data\smartport.db"

