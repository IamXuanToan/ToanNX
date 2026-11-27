---
name: commit-push
description: "Kiểm tra, tái lập đầy đủ và sửa lỗi các cổng CI GitHub Actions (backend, frontend, api-types, rules/skills parity) trên máy local hoặc qua GitHub CLI, rồi thực hiện stage, tạo commit chuẩn Conventional Commits của repo ToanNX và git push lên remote khi người dùng gọi. Tôn trọng .githooks, PostgreSQL local, kiểm tra an toàn secret và tuyệt đối không thêm Co-Authored-By hay nguồn bên ngoài."
---

# Kiểm tra CI, Commit và Push lên Remote (`commit-push`)

Skill này tái lập đầy đủ pipeline CI của `.github/workflows/ci.yml` cùng `scripts/check-all.ps1` / `scripts/check-all.sh` để bảo đảm mọi cổng kiểm tra đều xanh trước khi đẩy, rồi thực hiện **`git add` → `git commit` → `git push`** lên remote khi người dùng **gọi rõ ràng** (`/commit-push`, `$commit-push`, yêu cầu kiểm tra CI để push hoặc yêu cầu commit và push lên). Tuyệt đối không tự kích hoạt ở cuối các task khác.

> **Nguyên tắc an toàn cứng:**
> - **TUYỆT ĐỐI KHÔNG chèn nguồn hoặc chữ ký AI bên ngoài** (`Co-Authored-By: Claude ...`, `Co-Authored-By: ... <noreply@anthropic.com>`, `Generated with ...`) vào bất kỳ commit nào.
> - **TUYỆT ĐỐI KHÔNG dùng `--no-verify`** để lách `.githooks/commit-msg` hoặc `.githooks/pre-push`.
> - **CẤM `--force`** lên `main`, `develop`, `release/*`; mọi thao tác viết lại lịch sử hay force push đều phải do người dùng yêu cầu tường minh.
> - **Kiểm CI đầy đủ nhưng không tự ý chạy full E2E**: khi chạy `commit-push` (hoặc được yêu cầu kiểm CI trước push), chạy đầy đủ 4 pha CI bên dưới là yêu cầu tường minh; riêng `pnpm e2e` nằm ngoài `.github/workflows/ci.yml` nên chỉ chạy khi được yêu cầu.
> - **PostgreSQL local khi test BE**: `DATABASE_URL` phải trỏ PostgreSQL local (`postgresql://postgress:123456@localhost:5432/toannx?sslmode=prefer`) và chạy `uv run pytest --reuse-db` (`backend/conftest.py` tự chặn DB cloud/Neon).
> - **Không lách cổng kiểm**: cấm thêm `# noqa`, `# type: ignore`, `eslint-disable`, skip test, nới assertion hay bỏ kiểm convention để xanh giả. Mọi bản sửa phải tuân thủ `docs/rules/` (`common.md`, `backend.md`, `frontend.md`, `git.md`).

---

## Bước 1 — Kiểm tra trạng thái Git, cấu hình CI, nhánh và bảo mật

1. Đọc `.github/workflows/ci.yml`, `scripts/check-all.ps1` / `scripts/check-all.sh`, `AGENTS.md`, `docs/rules/common.md` (mục 7) và `docs/rules/git.md`.
2. Kiểm tra worktree (chỉ đọc):
   ```powershell
   git branch --show-current
   git status --short
   git diff --stat
   ```
   Ghi nhận file đã sửa, file untracked (`-u`), thay đổi lockfile (`backend/uv.lock`, `frontend/pnpm-lock.yaml`) và các vùng nhạy cảm với CI (route, view, docstring view/method, serializer, model, permission, migration, i18n, CSS token).
3. **Bảo vệ nhánh hiện tại & hook**:
   - Nếu đang ở nhánh **`main`** và người dùng chưa xác nhận rõ cho phép commit/push thẳng vào `main` → **dừng lại hỏi xác nhận** trước khi commit.
   - Kiểm tên nhánh hiện tại có khớp `.githooks/pre-push` (`main`, `develop`, `feat|fix|ref|docs|test|perf|build|ci|chore|hotfix/...`, `release/x.y.z`); nếu sai mẫu sẽ không push được, báo người dùng hướng xử lý.
   - Kiểm trạng thái hook local (`git config --get core.hooksPath`); nếu chưa trỏ `.githooks`, vẫn kiểm chặt mẫu commit message trước khi commit.
4. **Rà file nhạy cảm & rác build**:
   - Không bao giờ stage `.env`, `.env.local`, khóa cá nhân, token, `media/`, DB local, `.next/`, `.next-e2e/`, `node_modules/`, file scratch hoặc ghi chú cá nhân đang mở chưa yêu cầu commit (VD: `docs/note.md`).
   - Luôn stage tường minh theo từng path sạch (`git add -- <paths>`), **không** `git add -A` mù quáng; nếu phát hiện file nhạy cảm chưa ignored thì loại trừ và cảnh báo người dùng.
5. **Trường hợp điều tra run đang đỏ trên GitHub** (nếu máy có `gh` CLI đã đăng nhập):
   ```powershell
   gh run list --limit 5
   gh run view <run-id> --log-failed
   ```

---

## Bước 2 — Tái lập đầy đủ và sửa lỗi các cổng GitHub CI (4 pha)

Xem bảng tra cứu lỗi thường gặp và cách sửa chuẩn tại [bảng đối chiếu GitHub CI](references/ci-matrix.md). Lưu ý: `scripts/check-all.*` chưa bao gồm bước `spectacular --validate`, `makemigrations --check --dry-run` và kiểm lệch `api-types`, nên chạy đủ 4 pha sau (từ nhanh đến nặng):

### 2.1 Pha 0 — Rule AI, Skill, Sổ theo dõi Audit & Lockfile

Từ gốc repo:
```powershell
uv run --no-project python scripts/sync-ai-rules.py --check
uv run --no-project python scripts/check-workflow-skills.py
uv run --no-project python scripts/audit_tracker.py sync
```
Kiểm tra `uv run --no-project python scripts/audit_tracker.py list-pending --format table` để biết còn file nào vừa sửa đang `NEEDS_CHECK` (nếu có và người dùng yêu cầu kiểm đủ trước khi push thì nhắc hoặc thực hiện audit đúng trục trước khi commit; nếu đồng bộ tạo thay đổi ở `docs/reports/code-audit-tracker.md`, nhớ kiểm tra và stage kèm).
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
Nếu `api-schema.gen.ts` thay đổi hợp lệ theo sửa đổi BE hiện tại, giữ thay đổi đó để commit cùng lần và chạy `pnpm --dir frontend -s typecheck` + `pnpm --dir frontend exec vitest run tests/unit/api-contract.test.ts`.

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
- Sau `pnpm -s build` (hoặc khi từng chạy `.next-e2e`), kiểm `git diff -- frontend/tsconfig.json` để bảo đảm không bị ghi đè ngoài ý muốn.

### 2.5 Khoanh vùng sai lệch Local ↔ GitHub Runner & Sửa tận gốc

Nếu có bước fail hoặc CI trên GitHub đỏ dù máy local xanh, đối chiếu 6 nguyên nhân phổ biến sau, sửa đúng nguyên nhân gốc rồi chạy lại toàn bộ các pha bị ảnh hưởng đến khi exit code `0`:
1. **`DJANGO_DEBUG=False` vs `.env.local`**: CI không có `.env.local`; kiểm tra nhánh code phụ thuộc env local.
2. **Linux case-sensitive vs Windows**: rà chữ hoa/thường trong import và đường dẫn `public/`.
3. **Database sạch trên CI**: test không được phụ thuộc dữ liệu dev tạo sẵn ngoài fixture/migration.
4. **File untracked / quên commit**: kiểm `git status -u` cho file mới hoặc migration mới.
5. **Trùng unique hoặc phụ thuộc thời gian UTC**: tránh va chạm `code`, `slug`, `dedup_key`.
6. **Sửa docstring view/method BE nhưng quên `pnpm api:types`**: `drf-spectacular` đưa docstring vào OpenAPI.

> Nếu người dùng **chỉ** yêu cầu kiểm tra/sửa CI (không yêu cầu commit hay push), dừng lại ở đây, kiểm `.agents/rules/90-done-checklist.md` và báo cáo kết quả CI chi tiết. Nếu đang chạy `/commit-push`, tiếp tục Bước 3.

---

## Bước 3 — Tách nhóm logic, Stage và Commit chuẩn

1. **Phạm vi & tách nhóm**:
   - Nếu người dùng chỉ định rõ phạm vi file/mục tiêu → chỉ stage đúng nhóm đó, giữ nguyên thay đổi khác.
   - Nếu worktree có nhiều thay đổi thuộc các mục đích độc lập nhau (ví dụ tính năng theo module, tối ưu UX dùng chung, cập nhật rule/skill/tài liệu) → tách thành từng commit sạch theo mục đích (`docs/rules/git.md`), không nhồi chung một commit khổng lồ trừ khi là thay đổi liên kết chặt chẽ.
2. **Stage & kiểm diff đang stage**:
   ```powershell
   git add -- <cac-file-thuoc-commit>
   git diff --cached --stat
   git diff --cached --check
   ```
   Xác minh không có conflict marker, secret bị lọt hay file nhầm trước khi commit.
   - Nếu phát hiện cần sửa thêm file trong lúc kiểm CI → sửa xong phải chạy lại đủ cổng CI bị ảnh hưởng trước khi commit cuối.
3. **Soạn commit message sạch (KHÔNG `Co-Authored-By:`)**:
   - Tiêu đề ≤ 72 ký tự, mẫu `<type>(<scope>): <imperative-english-lowercase-no-period>` đúng `.githooks/commit-msg` (scope nhiều khu vực phân tách bằng `, ` nếu cần).
   - Dòng trống thứ 2, body tiếng Anh súc tích dựa trên diff thật (đã đổi gì, vì sao, tác động migration/API/test).
   - Thực thi commit bằng hai cờ `-m` (tiêu đề riêng, body riêng) hoặc pipe `--file -` từ stdin để không tạo file tạm rác, **tuyệt đối không thêm bất kỳ dòng `Co-Authored-By:` hay ghi công AI nào**.
   - Sau mỗi commit, chạy `git log -1 --format=%B` để xác nhận nội dung commit lưu trong Git hoàn toàn sạch, không dính trailer bên ngoài.

---

## Bước 4 — Đồng bộ & Push lên Remote (`origin`)

1. Kiểm upstream của nhánh hiện tại:
   ```powershell
   git rev-parse --abbrev-ref --symbolic-full-name '@{u}'
   ```
2. **Trường hợp đã có upstream**:
   - Kiểm tra xem remote có commit mới chưa (`git fetch origin <branch> && git status -sb`).
   - Nếu nhánh local bị chậm sau remote (behind) hoặc phân kỳ (diverged): báo rõ hoặc chạy `git pull --rebase` khi an toàn (không có conflict bất ngờ); nếu phát sinh conflict thì dừng báo người dùng xử lý, không tự ý force push.
   - Chạy `git push`.
3. **Trường hợp chưa có upstream**:
   - Chạy `git push -u origin <branch>`.

---

## Bước 5 — Báo cáo kết quả

Báo ngắn gọn bằng **tiếng Việt có dấu**:
- Từng cổng CI đã chạy across 4 pha (Rules/Skills, Backend format/lint/mypy/spectacular/makemigrations/pytest, `api-types`, Frontend lint/format/typecheck/test/build) và kết quả thật (exit code / số test pass), lỗi gốc đã sửa (nếu có), phần chưa chạy (như `pnpm e2e` nếu không yêu cầu).
- Nhánh đã push và tên remote (`origin/<branch>`).
- Danh sách commit vừa tạo (`hash ngắn` + tiêu đề + nhóm file tương ứng), xác nhận đã vượt qua `.githooks` và không có `Co-Authored-By:` hay nguồn bên ngoài.
- Kết quả `git push` thực tế và trạng thái `git status --short` còn lại (file nào được giữ lại chưa commit nếu có).
