@echo off
REM ==============================================================================
REM Quick Launcher: Starts Backend API and Frontend UI in separate windows
REM ==============================================================================
echo Starting Secure E-Voting System...

echo [1/2] Launching Backend on http://127.0.0.1:8000 ...
start "Backend - Secure E-Voting API" cmd /k "cd /d %~dp0backend && uvicorn app.main:app --reload --port 8000"

echo [2/2] Launching Frontend on http://localhost:5173 ...
start "Frontend - Secure E-Voting Portal" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ======================================================================
echo Both servers have been launched in separate terminal windows!
echo - Voter Portal:       http://localhost:5173
echo - Admin Portal:       http://localhost:5173/admin/login
echo - API Documentation:  http://127.0.0.1:8000/docs
echo ======================================================================
pause
