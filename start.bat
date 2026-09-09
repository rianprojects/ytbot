@echo off
cd /d %~dp0

echo Starting ytbot server...
start "ytbot-server" cmd /k "cd /d %~dp0server && npm start"

echo Waiting for server on port 3001...
:waitserver
curl -s -o nul http://localhost:3001/ 2>nul
if errorlevel 1 (
  timeout /t 1 /nobreak >nul
  goto waitserver
)

echo Server is up. Starting client...
start "ytbot-client" cmd /k "cd /d %~dp0client && npm run dev"

echo Waiting for client on port 5173...
:waitclient
curl -s -o nul http://localhost:5173/ 2>nul
if errorlevel 1 (
  timeout /t 1 /nobreak >nul
  goto waitclient
)

start "" "http://localhost:5173"
