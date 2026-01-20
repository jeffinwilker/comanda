@echo off
setlocal
cd /d "%~dp0"
start "comanda-dev" cmd /k "npm run dev -- -H 0.0.0.0 -p 3000"
echo Dev server started on http://localhost:3000 (LAN via your IP).
endlocal
