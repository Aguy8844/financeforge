@echo off
setlocal
cd /d "%~dp0"
set PORT=5173
set URL=http://127.0.0.1:%PORT%/

echo FinanceForge wird lokal gestartet...
echo URL: %URL%
echo.

where py >nul 2>nul
if %errorlevel%==0 (
  start "" "%URL%"
  py -m http.server %PORT% --bind 127.0.0.1
  goto :done
)

where python >nul 2>nul
if %errorlevel%==0 (
  start "" "%URL%"
  python -m http.server %PORT% --bind 127.0.0.1
  goto :done
)

echo Python wurde nicht gefunden.
echo Installiere Python oder starte den Ordner mit einem beliebigen lokalen Webserver.
echo Danach im Browser oeffnen: %URL%
pause

:done
endlocal
