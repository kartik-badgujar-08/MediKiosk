@echo off
echo ===================================================
echo Starting MediKiosk Full-Stack Services
echo ===================================================
echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "MediKiosk Backend (Port 8000)" cmd /k "cd /d %~dp0 && backend\venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000"

echo [2/2] Starting React/Vite Frontend on http://127.0.0.1:5173 ...
start "MediKiosk Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev -- --host 127.0.0.1 --port 5173"

echo ===================================================
echo Both services are starting in separate windows!
echo Web App: http://127.0.0.1:5173/kiosk
echo Backend API Docs: http://127.0.0.1:8000/docs
echo ===================================================
