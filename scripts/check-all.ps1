# Chạy toàn bộ kiểm tra của dự án. Dừng ngay ở bước đầu tiên thất bại (exit code khác 0).
# Cùng quy trình với scripts/check-all.sh.
# Lệnh native (uv, pnpm) ghi log ra stderr; dựa vào $LASTEXITCODE thay vì coi stderr là lỗi.
$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
$env:PYTHONUTF8 = "1"

function Invoke-Step([string]$Title, [scriptblock]$Command) {
    Write-Host "`n==> $Title"
    & $Command
    if ($LASTEXITCODE -ne 0) {
        Write-Host "THẤT BẠI: $Title" -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

Push-Location (Join-Path $Root "backend")
try {
    Invoke-Step "0. Rule AI dong bo (.agents/rules -> .claude)" { uv run --no-project python (Join-Path $Root "scripts/sync-ai-rules.py") --check }
    Invoke-Step "0b. Skill workflow dong bo (.agents/skills -> .claude)" { uv run --no-project python (Join-Path $Root "scripts/check-workflow-skills.py") }
    Invoke-Step "1. Backend format check (ruff format --check)" { uv run ruff format --check . }
    Invoke-Step "2a. Backend lint (ruff check)" { uv run ruff check . }
    Invoke-Step "2b. Backend type check (mypy)" { uv run mypy . }
    Invoke-Step "3. Backend tests (pytest, PostgreSQL test database)" { uv run pytest --reuse-db -q }
} finally { Pop-Location }

Push-Location (Join-Path $Root "frontend")
try {
    Invoke-Step "4a. Frontend lint (eslint)" { pnpm -s lint }
    Invoke-Step "4b. Frontend format check (prettier)" { pnpm -s format:check }
    Invoke-Step "5a. Frontend typecheck" { pnpm -s typecheck }
    Invoke-Step "5b. Frontend unit tests" { pnpm -s test }
    Invoke-Step "6. Frontend production build" { pnpm -s build }
} finally { Pop-Location }

Write-Host "`nTẤT CẢ KIỂM TRA ĐỀU PASS" -ForegroundColor Green
