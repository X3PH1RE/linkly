@echo off
echo Starting SmartMeet Video Communication Platform...
echo.
echo Starting Frontend (React + Vite)...
start "Frontend" cmd /k "npm run dev"
echo.
echo Starting Backend (Express + LiveKit)...
start "Backend" cmd /k "npm run server"
echo.
echo Both servers are starting...
echo Frontend: http://localhost:5173
echo Backend: http://localhost:3001
echo.
echo Make sure to start a LiveKit server at ws://localhost:7880
echo You can download it from: https://get.livekit.io
echo.
pause 