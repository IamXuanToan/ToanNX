---
name: check-ci
description: "Kiểm tra, tái lập đầy đủ và sửa lỗi các bước CI GitHub Actions (backend, frontend, api-types, rules/skills parity) trên máy local hoặc qua GitHub CLI để đảm bảo CI luôn pass khi push/PR trong repo ToanNX."
---

# Kiểm tra và bảo đảm GitHub CI luôn Pass

Skill này tái lập đầy đủ pipeline CI của `.github/workflows/ci.yml` cùng các cổng kiểm chuẩn trong `scripts/check-all.ps1` / `scripts/check-all.sh`, khoanh vùng sai lệch giữa máy dev với runner Ubuntu trên GitHub, sửa tận gốc mọi lỗi phát sinh và xác minh lại đến khi xanh toàn bộ.

> **Quy tắc bắt buộc & an toàn:**
> - Khi người dùng yêu cầu kiểm tra CI (gọi `check-ci` hoặc yêu cầu chạy kiểm tra trước khi push/đảm bảo CI pass), việc chạy đầy đủ các cổng CI là yêu cầu tường minh. Riêng `pnpm e2e` nằm ngoài `.github/workflows/ci.yml` nên chỉ chạy khi được yêu cầu.
> - **PostgreSQL local khi test BE**: `DATABASE_URL` phải trỏ PostgreSQL local (`postgresql://postgress:123456@localhost:5432/toannx?sslmode=prefer`) và chạy `uv run pytest --reuse-db` (`backend/conftest.py` tự chặn DB cloud/Neon).
> - **Không lách cổng kiểm**: cấm thêm `# noqa`, `# type: ignore`, `eslint-disable`, skip test, nới assertion hay bỏ kiểm convention để xanh giả. Mọi bản sửa phải tuân thủ `docs/rules/` (`common.md`, `backend.md`, `frontend.md`, `git.md`).

## 1. Đọc cấu hình CI và đối chiếu trạng thái

1. Đọc `.github/workflows/ci.yml`, `scripts/check-all.ps1` / `scripts/check-all.sh`, `AGENTS.md`, `docs/rules/common.md` (mục 7), `docs/rules/git.md`.
2. Kiểm tra `git status` và `git diff --stat` (chỉ đọc) để nắm file đã sửa, file untracked, thay đổi lockfile (`backend/uv.lock`, `frontend/pnpm-lock.yaml`) và các vùng nhạy cảm với CI (route, view, docstring, serializer, model, permission, migration, i18n, CSS token).
3. Nếu cần điều tra một run đang đỏ trên GitHub và máy có `gh` CLI đã đăng nhập, xem log thất bại trước:
   ```bash
   gh run list --limit 5
   gh run view <run-id> --log-failed
   ```
   Nếu không dùng `gh` hoặc cần bảo đảm xanh trước khi push, chạy trực tiếp toàn bộ cổng CI ở bước 2.

## 2. Chạy tái lập đủ các cổng CI (từ nhanh đến nặng)

Xem bảng tra cứu lỗi thường gặp và cách sửa chuẩn tại [bảng đối chiếu GitHub CI](references/ci-matrix.md). Lưu ý: `scripts/check-all.*` chưa bao gồm bước `spectacular --validate`, `makemigrations --check --dry-run` và kiểm lệch `api-types`, nên phải chạy bổ sung đủ 4 pha bên dưới.

### 2.1 Pha 0 — Rule AI, Skill & Lockfile

Từ gốc repo:
```powershell
uv run --no-project python scripts/sync-ai-rules.py --check
uv run --no-project python scripts/check-workflow-skills.py
```
Nếu có sửa dependency (`backend/pyproject.toml` hoặc `frontend/package.json`), kiểm khóa version tương ứng CI: `uv sync --frozen` (trong `backend/`) và `pnpm install --frozen-lockfile` (trong `frontend/`).

### 2.2 Pha 1 — Job `backend` (`.github/workflows/ci.yml`)

Chạy trong `backend/` với `PYTHONUTF8=1`:
1. Format, Lint & Type check:
   ```powershell
   uv run ruff format --check .
   uv run ruff check .
   uv run mypy .
   ```
2. OpenAPI warning-free & Migration parity (giả lập `DJANGO_DEBUG=False` như runner CI):
   - Trên bash: `DJANGO_DEBUG=False uv run python manage.py spectacular --validate --fail-on-warn > /dev/null`
   - Trên PowerShell (khôi phục lại `DJANGO_DEBUG` sau khi chạy để không ảnh hưởng lệnh dev tiếp theo):
     ```powershell
     $prevDebug = $env:DJANGO_DEBUG; $env:PYTHONUTF8="1"; $env:DJANGO_DEBUG="False"
     try { uv run python manage.py spectacular --validate --fail-on-warn | Out-Null } finally {
         if ($null -eq $prevDebug) { Remove-Item Env:DJANGO_DEBUG -ErrorAction SilentlyContinue } else { $env:DJANGO_DEBUG = $prevDebug }
     }
     uv run python manage.py makemigrations --check --dry-run
     ```
3. Toàn bộ test Backend trên PostgreSQL local:
   ```powershell
   uv run pytest --reuse-db -q
   ```
   Nếu mới thêm/sửa migration chưa áp lên DB test local, chạy `uv run pytest --reuse-db --create-db -q` ở lượt đầu. Chú ý các cổng quy ước BE trong `app/core/tests/`: `test_endpoint_access.py`, `test_list_query_count.py`, `test_module_conventions.py`, `test_module_registry.py`, `test_one_class_per_file.py`, `test_openapi_schema.py`.

### 2.3 Pha 2 — Job `api-types` (OpenAPI ↔ TypeScript)

CI chạy `pnpm -s api:types` rồi kiểm `git diff --exit-code -- frontend/src/shares/types/api-schema.gen.ts`. Mọi thay đổi đi vào OpenAPI (route, view, serializer, `help_text`, `@extend_schema`, error code **hoặc chỉ docstring của class view/HTTP method**) đều làm job này đỏ nếu quên sinh lại:
```powershell
pnpm --dir frontend -s api:types
git diff -- frontend/src/shares/types/api-schema.gen.ts
```
Nếu `api-schema.gen.ts` thay đổi hợp lệ theo sửa đổi BE hiện tại, giữ thay đổi đó để commit cùng lần và chạy `pnpm --dir frontend -s typecheck` + `pnpm --dir frontend test tests/unit/api-contract.test.ts`.

### 2.4 Pha 3 — Job `frontend` (`.github/workflows/ci.yml`)

Chạy trong `frontend/`:
```powershell
pnpm -s lint
pnpm -s format:check
pnpm -s typecheck
pnpm -s test
pnpm -s build
```
- `pnpm -s lint` dùng `--max-warnings 0`: bất kỳ warning ESLint nào cũng làm CI fail.
- `pnpm -s test` bao gồm các test quy ước kiến trúc (`one-unit-per-file`, `module-structure`, `table-conventions`, `module-registry`, `theme-tokens`, `messages`, `api-contract`, `code-conventions`).
- Sau `pnpm -s build` (hoặc khi từng chạy build thư mục riêng `.next-e2e`), kiểm `git diff -- frontend/tsconfig.json` để đảm bảo không bị ghi đè ngoài ý muốn.

## 3. Khoanh vùng sai lệch Local ↔ GitHub Runner

Khi máy local xanh nhưng GitHub CI vẫn fail, đối chiếu 6 nguyên nhân phổ biến sau:
1. **`DJANGO_DEBUG=False` vs `.env.local`**: CI chạy `DJANGO_DEBUG="False"` và không có `.env.local`; kiểm tra các đường code phụ thuộc biến trong `.env.local` (Redis/R2/OAuth/Firebase/CORS/ALLOWED_HOSTS rỗng).
2. **Linux case-sensitive vs Windows**: import sai hoa/thường tên file hoặc đường dẫn asset trong `public/` chạy được trên Windows nhưng fail `next build` / `pytest` trên `ubuntu-latest`.
3. **Database sạch trên CI**: CI khởi tạo Postgres 17 trống từ migration đầu tới cuối, không có dữ liệu dev/seed tay. Test không được dựa vào dữ liệu tạo sẵn ngoài fixture/migration.
4. **File untracked / quên commit**: file mới hoặc migration chưa được theo dõi nên tồn tại ở local nhưng thiếu trên remote; kiểm kỹ `git status -u`.
5. **Trùng dữ liệu / test phụ thuộc thứ tự hoặc thời gian**: chạy toàn suite không `--reuse-db` hoặc đổi thứ tự gây va chạm `unique` (`code`, `slug`, `dedup_key`) hoặc lệch múi giờ UTC.
6. **Sửa docstring/comment view BE nhưng quên `pnpm api:types`**: `drf-spectacular` đưa docstring của class view và method HTTP vào mô tả OpenAPI, làm `api-types` fail dù logic không đổi.

## 4. Vòng lặp sửa lỗi, xác minh lại và bàn giao

1. Gom toàn bộ lỗi từ 4 pha, truy nguyên nhân gốc trong source và tài liệu liên quan rồi sửa chuẩn kiến trúc repo; không vá triệu chứng.
2. Sau lần chỉnh sửa cuối cùng, chạy lại toàn bộ các bước đã fail và chạy lại trọn chuỗi CI bị ảnh hưởng (BE + `api-types` + FE + rule/skill check) để bảo đảm toàn bộ trả exit code `0` không lỗi, không warning.
3. Kiểm theo `.agents/rules/90-done-checklist.md`, cập nhật `docs/` nếu hành vi/hợp đồng đổi, đọc `git status` và `git diff` (không tự stage/commit/push).
4. Báo cáo bằng tiếng Việt có dấu: liệt kê từng cổng CI đã chạy và kết quả thật (exit code / số test pass), lỗi gốc đã sửa (nếu có), giới hạn chưa kiểm (ví dụ E2E hoặc remote `gh`), kèm nội dung commit chuẩn `docs/rules/git.md` trong khối `text`.
