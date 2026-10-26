@echo off
setlocal
cd /d "%~dp0services\rutero"
chcp 65001 >nul
set "PYTHONUTF8=1"

set "PY=python"
where py >nul 2>nul && set "PY=py -3"

echo ============================================
echo   rutero-mock  (servidor de desarrollo)
echo   Igual que el original: HTTP, sin TLS
echo ============================================
echo.
%PY% -m pip install --disable-pip-version-check -q -r requirements-windows.txt
if errorlevel 1 (
  echo ERROR: no se pudieron instalar las dependencias.
  pause
  exit /b 1
)

echo Arrancando en  http://0.0.0.0:8080/rutero  (Ctrl+C para parar)
%PY% roadmapMockOnline.py --host 0.0.0.0 --port 8080 --no-tls
pause
