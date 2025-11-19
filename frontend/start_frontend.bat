@echo off
echo ========================================
echo   AgriAssist - Starting Application
echo ========================================
echo.

echo [1/2] Starting Backend Server...
cd backend
start cmd /k "python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo Backend starting at http://localhost:8000
echo.

ping -n 3 127.0.0.1 > nul

echo [2/2] Opening Frontend...
cd ..
start index.html
echo.

echo ========================================
echo   AgriAssist is now running!
echo ========================================
echo.
echo Frontend: Open index.html in browser
echo Backend API: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
echo Press any key to exit...
pause > nul