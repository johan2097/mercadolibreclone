@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo No se encontro Node.js. Instala Node.js 18 o superior desde https://nodejs.org/
  pause
  exit /b 1
)
echo Iniciando CompraFacil...
start "CompraFacil" cmd /c "timeout /t 2 >nul & start http://localhost:3000"
node server.js
pause
