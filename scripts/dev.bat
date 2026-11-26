@echo off
rem Chay moi truong dev trong MOT terminal:
rem   1. Giai phong 2 cong 8001 va 3001 neu dang bi chiem
rem   2. Tu dong cai/dong bo dependency backend (uv sync) va frontend (pnpm install)
rem   3. Tao & chay migration database
rem   4. Khoi chay ca backend (8001) va frontend (3001) qua supervisor (stop la tat ca hai)
rem Cach dung: double-click file nay, hoac chay `scripts\dev.bat` tu thu muc goc.
setlocal
chcp 65001 >nul
set "PYTHONUTF8=1"
set "PYTHONUNBUFFERED=1"

for %%I in ("%~dp0..") do set "ROOT=%%~fI"
set "BACKEND=%ROOT%\backend"
set "FRONTEND=%ROOT%\frontend"
rem Cong co dinh: frontend goi API sang 8001, CSRF_TRUSTED_ORIGINS cho phep localhost:3001.
set "BACKEND_PORT=8001"
set "FRONTEND_PORT=3001"

where uv >nul 2>&1
if errorlevel 1 (
  echo [dev] Khong tim thay uv trong PATH. Cai dat uv truoc khi chay.
  goto :fail
)

where pnpm >nul 2>&1
if errorlevel 1 (
  echo [dev] Khong tim thay pnpm trong PATH. Cai dat pnpm truoc khi chay.
  goto :fail
)

if not exist "%BACKEND%\.env.local" if not exist "%BACKEND%\.env" (
  echo [dev] Thieu backend\.env.local hoac backend\.env.
  echo [dev] Tao tu backend\.env.example roi dien DATABASE_URL va DJANGO_SECRET_KEY.
  goto :fail
)

if not exist "%FRONTEND%\.env.local" if not exist "%FRONTEND%\.env" (
  echo [dev] Canh bao: chua co frontend\.env.local hay frontend\.env, tam dung API http://localhost:%BACKEND_PORT%.
  if not defined NEXT_PUBLIC_API_URL set "NEXT_PUBLIC_API_URL=http://localhost:%BACKEND_PORT%"
  if not defined NEXT_PUBLIC_SITE_URL set "NEXT_PUBLIC_SITE_URL=http://localhost:%FRONTEND_PORT%"
)

echo [dev] 1/6 Giai phong cong %BACKEND_PORT% va %FRONTEND_PORT% neu dang ban...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\free-port.ps1" -Ports "%BACKEND_PORT%,%FRONTEND_PORT%" -FrontendDir "%FRONTEND%"
if errorlevel 1 (
  echo [dev] Khong the giai phong cong %BACKEND_PORT%/%FRONTEND_PORT%.
  goto :fail
)

echo [dev] 2/6 Cai/dong bo dependency backend (uv sync)...
pushd "%BACKEND%"
call uv sync
if errorlevel 1 (
  popd
  echo [dev] uv sync that bai. Kiem tra uv va pyproject.toml/uv.lock trong backend\.
  goto :fail
)
popd

echo [dev] 3/6 Cai/dong bo dependency frontend (pnpm install)...
pushd "%FRONTEND%"
call pnpm install
if errorlevel 1 (
  popd
  echo [dev] pnpm install that bai. Kiem tra pnpm va ket noi mang.
  goto :fail
)
popd

echo [dev] 4/6 Kiem tra migrations database...
pushd "%BACKEND%"
call uv run --no-sync python manage.py makemigrations
if errorlevel 1 (
  popd
  echo [dev] Migrations that bai. Kiem tra PostgreSQL dang chay va DATABASE_URL trong backend\.env / .env.local.
  goto :fail
)
popd

echo [dev] 5/6 Migrate database...
pushd "%BACKEND%"
call uv run --no-sync python manage.py migrate
if errorlevel 1 (
  popd
  echo [dev] Migrate that bai. Kiem tra PostgreSQL dang chay va DATABASE_URL trong backend\.env / .env.local.
  goto :fail
)
popd

echo [dev] 6/6 Khoi chay Backend (http://localhost:%BACKEND_PORT%) va Frontend (http://localhost:%FRONTEND_PORT%/vi/dang-nhap)...
echo [dev] Nhan Ctrl+C hoac dong cua so de dung ca hai server.
echo.
if exist "%BACKEND%\.venv\Scripts\python.exe" (
  "%BACKEND%\.venv\Scripts\python.exe" "%ROOT%\scripts\dev_runner.py" --backend-dir "%BACKEND%" --frontend-dir "%FRONTEND%" --backend-port %BACKEND_PORT% --frontend-port %FRONTEND_PORT%
) else (
  pushd "%BACKEND%"
  call uv run --no-sync python "%ROOT%\scripts\dev_runner.py" --backend-dir "%BACKEND%" --frontend-dir "%FRONTEND%" --backend-port %BACKEND_PORT% --frontend-port %FRONTEND_PORT%
  popd
)
if errorlevel 1 goto :fail

endlocal
exit /b 0

:fail
echo.
pause
exit /b 1
