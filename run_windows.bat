@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
set "PYTHONUTF8=1"

rem Elige interprete: 'py -3' si existe, si no 'python'
set "PY=python"
where py >nul 2>nul && set "PY=py -3"

echo ============================================
echo   rutero-mock  (mock del Roadmap online)
echo   Carpeta: %CD%
echo ============================================
echo.
echo Instalando dependencias (Flask + waitress)...
%PY% -m pip install --disable-pip-version-check -q -r requirements-windows.txt
if errorlevel 1 (
  echo.
  echo ERROR: no se pudieron instalar las dependencias.
  echo Comprueba que Python 3 esta instalado y en el PATH.
  pause
  exit /b 1
)

echo.
echo Arrancando en  http://0.0.0.0:8080/rutero
echo (Ctrl+C para parar)
echo.
echo Si el MPC80T no puede conectarse, permite el puerto 8080 en el
echo Firewall de Windows (o ejecuta este .bat como Administrador una vez).
echo.

%PY% serve_windows.py 8080
pause
