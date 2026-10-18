@echo off
REM ==============================================================================
REM Windows Test Runner for Secure E-Voting System
REM ==============================================================================
echo ======================================================================
echo [1/2] Running Backend Pytest Suite...
echo ======================================================================
cd /d "%~dp0..\backend"
python -m pytest -v
if errorlevel 1 goto error

echo.
echo ======================================================================
echo [2/2] Running Frontend Build and Type Check...
echo ======================================================================
cd /d "%~dp0..\frontend"
call npm run build
if errorlevel 1 goto error

echo.
echo ======================================================================
echo All tests and builds passed successfully!
echo ======================================================================
goto end

:error
echo.
echo [ERROR] Tests failed! Check error log above.
exit /b 1

:end
