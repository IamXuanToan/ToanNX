# Bảng đối chiếu GitHub Actions CI ↔ Local ToanNX

Nguồn đối chiếu trực tiếp từ `.github/workflows/ci.yml`, `scripts/check-all.ps1` và `scripts/check-all.sh`.

## 1. Ma trận các cổng kiểm tra CI

| Cổng / Job CI | Lệnh trên CI (`.github/workflows/ci.yml`) | Lệnh tái lập Local | Nguyên nhân hay gây đỏ & Cách xử lý chuẩn |
| --- | --- | --- | --- |
| Rule AI sync (`check-all`) | *(Trong `scripts/check-all.*`)* | `uv run --no-project python scripts/sync-ai-rules.py --check` | Sửa `.agents/rules/*.md` hoặc `.claude/{rules,commands,skills/rule-*}` mà chưa đồng bộ. Chạy `python scripts/sync-ai-rules.py`; không sửa tay file sinh tự động. |
| Skill parity (`check-all`) | *(Trong `scripts/check-all.*`)* | `uv run --no-project python scripts/check-workflow-skills.py` | Sửa skill project/chuyên môn chỉ ở `.agents/skills/` hoặc `.claude/skills/`, thiếu link `references/`, sai frontmatter hoặc thiếu dòng trong `.agents/rules/01-workflow.md`. Đồng bộ y hệt 2 bên. |
| BE deps (`backend`) | `uv sync --frozen` | `uv sync --frozen` (trong `backend/`) | Sửa `pyproject.toml` mà quên cập nhật `backend/uv.lock`. Chạy `uv lock` và commit `uv.lock` (chỉ khi dependency được duyệt). |
| BE Format (`backend`) | `uv run ruff format --check .` | `uv run ruff format --check .` | Lệch format Python (line length 110). Chạy `uv run ruff format <file>` (hoặc `.`). |
| BE Lint (`backend`) | `uv run ruff check .` | `uv run ruff check .` | Vi phạm `E/F/W/I/B/UP/S/DJ/SIM/N/BLE/T20/PLC0415` (Bandit `S`, `print` `T20`, import trong hàm `PLC0415`, bắt exception chung `BLE`). Sửa code sạch; cấm thêm `# noqa` che lỗi. |
| BE Type (`backend`) | `uv run mypy .` | `uv run mypy .` | Thiếu type hint (`disallow_untyped_defs = true`), sai kiểu `django-stubs`/`drf-stubs`. Bổ sung annotation đúng; tránh `# type: ignore`. |
| BE OpenAPI (`backend`) | `uv run python manage.py spectacular --validate --fail-on-warn > /dev/null` | `DJANGO_DEBUG=False` + `uv run python manage.py spectacular --validate --fail-on-warn` | Thiếu `@extend_schema`, serializer lồng không đặt tên rõ, `type` hint không khớp, `CoreApiView` thiếu serializer request/response. Sửa schema rõ ràng tới khi 0 warning. |
| BE Migrations (`backend`) | `uv run python manage.py makemigrations --check --dry-run` | `uv run python manage.py makemigrations --check --dry-run` | Sửa `models/` nhưng quên `makemigrations`. Sinh migration đúng chuẩn (`db-migration`), chạy `sqlmigrate` kiểm an toàn. |
| BE Tests (`backend`) | `uv run pytest -q` (Postgres 17 sạch) | `uv run pytest --reuse-db -q` (`DATABASE_URL` local) | Lỗi logic, quên đăng ký route vào `test_endpoint_access.py`, quên thêm query count ở `test_list_query_count.py`, vi phạm `test_one_class_per_file.py` / `test_module_conventions.py` / `test_openapi_schema.py`, dữ liệu unique trùng, code phụ thuộc `.env.local` khi `DJANGO_DEBUG=False`. |
| API Types (`api-types`) | `pnpm -s api:types` + `git diff --exit-code -- frontend/src/shares/types/api-schema.gen.ts` | `pnpm --dir frontend -s api:types` + `git diff -- frontend/src/shares/types/api-schema.gen.ts` | Đổi route, serializer, `@extend_schema`, `help_text`, error code hoặc docstring class view/method mà quên chạy `pnpm api:types`. Sinh lại và giữ `api-schema.gen.ts` trong commit. |
| FE deps (`frontend`) | `pnpm install --frozen-lockfile` | `pnpm install --frozen-lockfile` (trong `frontend/`) | Sửa `package.json` mà quên cập nhật `pnpm-lock.yaml`. Chạy `pnpm install` (chỉ khi dependency được duyệt). |
| FE Lint (`frontend`) | `pnpm -s lint` (`eslint --max-warnings 0`) | `pnpm -s lint` (trong `frontend/`) | Cả lỗi và **warning** ESLint (unused vars, React hooks deps, Next rules) đều fail CI. Sửa hết warning; không tắt rule bừa bãi. |
| FE Format (`frontend`) | `pnpm -s format:check` | `pnpm -s format:check` (trong `frontend/`) | Lệch Prettier (gồm sort class `prettier-plugin-tailwindcss`). Chạy `pnpm exec prettier --write <file>`. |
| FE Typecheck (`frontend`) | `pnpm -s typecheck` (`next typegen && tsc --noEmit`) | `pnpm -s typecheck` (trong `frontend/`) | Lỗi TypeScript, lệch kiểu sau khi `api:types` cập nhật, thiếu namespace trong `src/global.d.ts` / `messages.ts`. |
| FE Unit Tests (`frontend`) | `pnpm -s test` (`vitest run`) | `pnpm -s test` (trong `frontend/`) | Fail test nghiệp vụ hoặc test quy ước: `one-unit-per-file`, `module-structure`, `table-conventions`, `module-registry`, `theme-tokens`, `messages`, `api-contract`, `code-conventions`. Sửa đúng chuẩn repo. |
| FE Build (`frontend`) | `pnpm -s build` (`next build`) | `pnpm -s build` (trong `frontend/`) | Lỗi App Router/SSR (`useSearchParams` thiếu `Suspense`, import server-only vào client hoặc ngược lại, route/path sai hoa-thường trên Linux, lỗi metadata/image). Kiểm `git diff -- frontend/tsconfig.json` sau build nếu từng chạy `.next-e2e`. |

## 2. Phân biệt CI GitHub với E2E Playwright

- `.github/workflows/ci.yml` **không chạy E2E**: phần đầu file ghi rõ *"E2E chạy riêng ở máy dev"*.
- Khi người dùng yêu cầu chạy thêm E2E (`pnpm --dir frontend e2e` hoặc 1 spec cụ thể), Playwright dùng `frontend/playwright.config.ts` với cổng `8002`/`3002`, DB riêng `toannx_e2e` (`manage.py prepare_e2e`) và thư mục build `.next-e2e`. Sau khi chạy xong, kiểm tra `git diff -- frontend/tsconfig.json` xem `NEXT_DIST_DIR` có làm đổi `include` hay không; nếu có, trả lại sạch.

## 3. Danh sách rà nhanh các thay đổi dễ làm CI đỏ

1. **Thêm hoặc đổi route/view/serializer/docstring BE** → phải kiểm `spectacular --validate --fail-on-warn`, `test_endpoint_access.py`, `test_list_query_count.py` (nếu là list) và chạy `pnpm api:types`.
2. **Thêm/sửa model BE** → phải chạy `makemigrations --check --dry-run` (0 thay đổi tồn đọng), kiểm `test_one_class_per_file.py` và chạy `pytest --reuse-db --create-db` để kiểm migration thật.
3. **Thêm/đổi component, view, bảng, màu, i18n FE** → chú ý `one-unit-per-file.test.ts`, `module-structure.test.ts`, `table-conventions.test.ts`, `theme-tokens.test.ts`, `messages.test.ts`, `code-conventions.test.ts` trong `vitest`.
4. **Thêm file trên Windows** → rà lại viết hoa/thường tên file trong mọi `import` và đường dẫn trong `public/` để tránh fail trên Linux runner (`ubuntu-latest`).
