@echo off
setlocal
cd /d "%~dp0"
npm run build
start "comanda-prod" cmd /k "npm start"
echo Prod server started on http://localhost:3000
endlocal
