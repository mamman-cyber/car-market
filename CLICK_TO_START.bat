@echo off
echo Starting Car Market Design Environment...
echo This window must stay open for the app to work.
echo.
cd /d "%~dp0"
call npm run dev
pause
