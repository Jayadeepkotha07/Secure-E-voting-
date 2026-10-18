@echo off
REM ==============================================================================
REM Windows Setup Script for Secure E-Voting System
REM ==============================================================================
echo ======================================================================
echo [1/4] Installing Python Backend Dependencies...
echo ======================================================================
cd /d "%~dp0..\backend"
python -m pip install -r requirements.txt
if errorlevel 1 goto error

echo ======================================================================
echo [2/4] Seeding Database with Demo Elections and Records...
echo ======================================================================
cd /d "%~dp0"
python seed_demo.py
if errorlevel 1 goto error

echo ======================================================================
echo [3/4] Installing Frontend Dependencies...
echo ======================================================================
cd /d "%~dp0..\frontend"
call npm install
if errorlevel 1 goto error

echo ======================================================================
echo [4/4] Verifying Frontend Build...
echo ======================================================================
call npm run build
if errorlevel 1 goto error

echo.
echo ======================================================================
echo Setup completed successfully!
echo.
echo To start backend:
echo   cd backend ^&^& uvicorn app.main:app --reload --port 8000
echo.
echo To start frontend:
echo   cd frontend ^&^& npm run dev
echo ======================================================================
goto end

:error
echo.
echo [ERROR] Setup encountered a failure. Please check errors above.
exit /b 1

:end
