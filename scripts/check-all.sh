#!/usr/bin/env bash
# Chạy toàn bộ kiểm tra của dự án. Dừng ngay ở bước đầu tiên thất bại (exit code khác 0).
# Cùng quy trình với scripts/check-all.ps1.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PYTHONUTF8=1

step() { printf '\n==> %s\n' "$1"; }

step "0. Rule AI đồng bộ (.agents/rules → .claude)"
uv run --no-project python "$ROOT/scripts/sync-ai-rules.py" --check

step "0b. Skill workflow đồng bộ (.agents/skills → .claude)"
uv run --no-project python "$ROOT/scripts/check-workflow-skills.py"

cd "$ROOT/backend"
step "1. Backend format check (ruff format --check)"
uv run ruff format --check .
step "2. Backend lint + type check (ruff check, mypy)"
uv run ruff check .
uv run mypy .
step "3. Backend tests (pytest, PostgreSQL test database)"
uv run pytest --reuse-db -q

cd "$ROOT/frontend"
step "4. Frontend lint (eslint + prettier check)"
pnpm -s lint
pnpm -s format:check
step "5. Frontend typecheck + unit tests"
pnpm -s typecheck
pnpm -s test
step "6. Frontend production build"
pnpm -s build

printf '\nTẤT CẢ KIỂM TRA ĐỀU PASS\n'
