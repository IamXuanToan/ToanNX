@echo off
rem Chay moi truong dev trong MOT terminal: migrate database -> backend (8000, chay nen) + frontend (3000).
rem Cach dung: double-click file nay, hoac chay `scripts\dev.bat` tu thu muc goc.
rem Dung: Ctrl+C (hoac dong cua so) -> tat ca backend va frontend.
setlocal
chcp 65001 >nul

set "ROOT=%~dp0.."
set "BACKEND=%ROOT%\backend"
set "FRONTEND=%ROOT%\frontend"
rem Cong co dinh: frontend proxy /api sang 8000, CSRF_TRUSTED_ORIGINS cho phep localhost:3000.
set "BACKEND_PORT=8000"
set "FRONTEND_PORT=3000"

if not exist "%BACKEND%\.env" (
  echo [dev] Thieu backend\.env. Tao tu backend\.env.example roi dien DB_* va DJANGO_SECRET_KEY.
  goto :fail
)

rem Cong dang bi chuong trinh khac chiem thi dung lai: frontend se proxy nham sang app khac.
call :ensure_port_free %BACKEND_PORT% backend || goto :fail
call :ensure_port_free %FRONTEND_PORT% frontend || goto :fail

echo [dev] 1/3 Migrate database...
pushd "%BACKEND%"
call uv run python manage.py migrate
if errorlevel 1 (
  popd
  echo [dev] Migrate that bai. Kiem tra PostgreSQL dang chay va thong tin DB_* trong backend\.env.
  goto :fail
)
popd

if not exist "%FRONTEND%\node_modules" (
  echo [dev] Cai dependency frontend lan dau...
  pushd "%FRONTEND%"
  call pnpm install
  popd
)

echo [dev] 2/3 Backend (chay nen trong terminal nay): http://localhost:%BACKEND_PORT%
start "" /b /D "%BACKEND%" uv run python manage.py runserver %BACKEND_PORT%

echo [dev] 3/3 Frontend: http://localhost:%FRONTEND_PORT%/vi/dang-nhap
echo [dev] Nhan Ctrl+C de dung ca backend va frontend.
echo.
pushd "%FRONTEND%"
call pnpm dev -p %FRONTEND_PORT%
popd

rem Frontend da thoat: tat backend neu van con chay.
call :stop_port %BACKEND_PORT%
echo [dev] Da dung.
endlocal
exit /b 0

:ensure_port_free
rem %1 = cong, %2 = ten dich vu
set "BUSY_PID="
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /R /C:":%1 .*LISTENING"') do set "BUSY_PID=%%p"
if not defined BUSY_PID exit /b 0
echo [dev] Cong %1 cho %2 dang bi chiem boi PID %BUSY_PID%:
tasklist /FI "PID eq %BUSY_PID%" /FO LIST | findstr /B "Image PID"
echo [dev] Tat chuong trinh do (hoac: taskkill /PID %BUSY_PID% /T /F) roi chay lai.
exit /b 1

:stop_port
rem Tat tien trinh dang nghe cong %1 (backend do script nay khoi dong).
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /R /C:":%1 .*LISTENING"') do taskkill /PID %%p /T /F >nul 2>&1
exit /b 0

:fail
echo.
pause
exit /b 1
