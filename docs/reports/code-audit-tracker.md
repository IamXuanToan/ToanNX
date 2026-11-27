# Sổ theo dõi rà soát code toàn hệ thống (Code / Security / i18n / Permission)

- **Cập nhật lần cuối**: `2026-11-27 22:24`
- **Tổng file theo dõi**: `3226` · **PASS**: `3176` · **FIXED**: `48` · **NEEDS_CHECK**: `2`
- **Script đồng bộ & truy vấn**: [`scripts/audit_tracker.py`](../../scripts/audit_tracker.py)

## Quy trình vận hành với các skill

1. **Khi sửa hoặc tạo file code/tài liệu/config** (`start-task`, `fix`, `refactor`, `test`, `db-migration`, hoặc sửa tay):
   - Đánh dấu file cần kiểm tra lại kèm ngày sửa và mô tả ngắn:
     ```bash
     uv run --no-project python scripts/audit_tracker.py mark-changed --files <path...> --note "<mô tả thay đổi>"
     ```
2. **Khi chạy skill rà soát** (`review-code`, `review-security`, `i18n-audit`, `permission-audit`):
   - Bước đầu tiên **chỉ lấy danh sách file đang chờ (`NEEDS_CHECK`)** thuộc trục tương ứng (trừ khi người dùng yêu cầu rà toàn repo):
     ```bash
     uv run --no-project python scripts/audit_tracker.py list-pending --axis code
     ```
   - Rà đúng những file này (và caller/contract bị ảnh hưởng), sửa lỗi nếu có, chạy test liên quan rồi đóng dấu:
     ```bash
     uv run --no-project python scripts/audit_tracker.py mark-checked --axis code --files <path...> --status PASS
     ```
3. **Khi đổi trên Git / ngoài skill**: Chạy `uv run --no-project python scripts/audit_tracker.py sync` để tự động đối chiếu ngày commit `git log` + `git status` và đẩy các file sửa sau ngày kiểm lên hàng đợi.

> [!NOTE]
> Quy ước trạng thái: `PASS` = mọi trục áp dụng đều đã kiểm từ ngày thay đổi gần nhất trở về sau; `FIXED` = có sửa lỗi trong đợt rà soát và đã kiểm lại đạt; `NEEDS_CHECK` = file mới tạo hoặc có sửa đổi sau ngày kiểm gần nhất; `N/A` = trục không áp dụng cho loại file này.

## 1. Thống kê tổng hợp theo khu vực

<!-- AUDIT_SUMMARY:START -->
| Khu vực | Tổng file | PASS | FIXED | NEEDS_CHECK | Đạt Code | Đạt Security | Đạt i18n | Đạt Permission |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Backend · Core (`backend/app/core`) | 120 | 120 | 0 | 0 | 120/120 | 120/120 | 2/2 | 25/25 |
| Backend · System (`backend/app/system`) | 505 | 505 | 0 | 0 | 505/505 | 493/493 | 5/5 | 205/205 |
| Backend · Utilities (`backend/app/utilities`) | 180 | 180 | 0 | 0 | 180/180 | 174/174 | 1/1 | 33/33 |
| Backend · Novel (`backend/app/novel`) | 130 | 130 | 0 | 0 | 130/130 | 127/127 | 1/1 | 40/40 |
| Backend · Finance (`backend/app/finance`) | 160 | 160 | 0 | 0 | 160/160 | 156/156 | 1/1 | 46/46 |
| Backend · Workspace (`backend/app/workspace`) | 184 | 180 | 4 | 0 | 184/184 | 177/177 | 1/1 | 51/51 |
| Backend · Config & Root (`backend/config`, env, pyproject) | 16 | 16 | 0 | 0 | 16/16 | 9/9 | N/A | N/A |
| Frontend · Shares (`frontend/src/shares`) | 213 | 212 | 1 | 0 | 213/213 | 212/212 | 206/206 | 7/7 |
| Frontend · System (`frontend/src/modules/system`) | 317 | 315 | 2 | 0 | 317/317 | 315/315 | 282/282 | 96/96 |
| Frontend · Utilities (`frontend/src/modules/utilities`) | 162 | 160 | 2 | 0 | 162/162 | 160/160 | 147/147 | 37/37 |
| Frontend · Novel (`frontend/src/modules/novel`) | 144 | 144 | 0 | 0 | 144/144 | 142/142 | 128/128 | 37/37 |
| Frontend · Finance (`frontend/src/modules/finance`) | 133 | 131 | 2 | 0 | 133/133 | 131/131 | 117/117 | 26/26 |
| Frontend · Workspace (`frontend/src/modules/workspace`) | 148 | 146 | 0 | 2 | 148/148 | 146/146 | 125/127 | 39/39 |
| Frontend · Portal (`frontend/src/modules/portal`) | 42 | 40 | 2 | 0 | 42/42 | 40/40 | 41/41 | 25/25 |
| Frontend · Home (`frontend/src/modules/home`) | 31 | 31 | 0 | 0 | 31/31 | 31/31 | 29/29 | 7/7 |
| Frontend · Manage App (`frontend/src/modules/manage-app`) | 31 | 31 | 0 | 0 | 31/31 | 29/29 | 31/31 | 31/31 |
| Frontend · Core I18n, Proxy & Messages (`frontend/src/i18n`, `messages`, `proxy.ts`) | 10 | 8 | 2 | 0 | 10/10 | 8/8 | 10/10 | 1/1 |
| Frontend · App Router (`frontend/src/app`) | 139 | 139 | 0 | 0 | 139/139 | 138/138 | 137/137 | 3/3 |
| Frontend · Tests (`frontend/tests`) | 88 | 88 | 0 | 0 | 88/88 | 88/88 | 2/2 | 6/6 |
| Frontend · Config & Public (`frontend/*.ts`, `.env.example`, `public/`) | 17 | 16 | 1 | 0 | 17/17 | 3/3 | N/A | N/A |
| Scripts & CI (`scripts/`, `.github/`) | 10 | 10 | 0 | 0 | 10/10 | 10/10 | N/A | N/A |
| Rules, Skills & Prompts (`.agents/`, `AGENTS.md`, `CLAUDE.md`, `prompt.md`) | 384 | 365 | 19 | 0 | 384/384 | 1/1 | N/A | N/A |
| Tài liệu hệ thống (`docs/`) | 62 | 49 | 13 | 0 | 62/62 | N/A | N/A | N/A |
| **TỔNG CỘNG** | **3226** | **3176** | **48** | **2** | — | — | — | — |
<!-- AUDIT_SUMMARY:END -->

## 2. Hàng đợi file cần rà soát lại (`NEEDS_CHECK`)

<!-- AUDIT_QUEUE:START -->
Hiện có **2** file cần rà soát lại (đã sửa sau lần kiểm gần nhất hoặc mới tạo):

| File | Nhóm | Thay đổi gần nhất | Nguồn | Trục chờ check | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| `frontend/src/modules/workspace/messages/en.json` | frontend/workspace | 2026-11-27 | working-tree (MM) | i18n | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `frontend/src/modules/workspace/messages/vi.json` | frontend/workspace | 2026-11-27 | working-tree (MM) | i18n | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
<!-- AUDIT_QUEUE:END -->

## 3. Nhật ký các đợt rà soát

<!-- AUDIT_LOG:START -->
### Đợt rà soát toàn repo 4 trục — 2026-11-27

- **Phạm vi**: Toàn bộ `3.227` file theo dõi trên Backend (`backend/app`, `backend/config`), Frontend (`frontend/src`, `frontend/tests`), Scripts/CI (`scripts/`, `.github/`) và Tài liệu/Rules/Skills (`docs/`, `.agents/`, `AGENTS.md`, `CLAUDE.md`, `prompt.md`).
- **Trục kiểm tra**: `/review-code` · `/review-security` · `/i18n-audit` · `/permission-audit`.
- **Phát hiện & đã xử lý (`FIXED`)**:
  - **Bảo mật (`review-security`, `SEC-12`..`SEC-17`)**: Chặn lộ `errorMessage` và stack trace ở production trong `AppErrorContent`/`GlobalErrorContent` (`!env.isProduction`); sửa `IamSyncService.sync()` thu hồi quyền thừa trên `auto_grant` role (`remove_except`) và lọc `permission__is_active=True`; chặn Processing Instruction `<?xml-stylesheet ...?>` trong `svg_inspector.py`; lọc `\r`/`\n` tại `ClientErrorView` chống CRLF log injection; hạ timeout HTTP OAuth Google/GitHub xuống `<= 5s`; sinh CSPRNG `crypto.randomUUID()` cho OAuth CSRF `state` & affiliate import ID; giới hạn `MAX_IMPORT_CHAPTERS = 1000` và `content <= 200_000` ký tự cho API import truyện; bổ sung test âm `test_security_hardening.py`, `test_media_signatures.py` và `error-boundary-security.test.tsx`.
  - **Code & Kiến trúc (`review-code`)**: Tách truy vấn user khỏi `JournalRecorder` sang `UserRepository.find_email_by_id()` và bỏ `@staticmethod`; dọn tài liệu/comment `Uptime Monitor` cũ tại `docs/features/table-actions.md`, `docs/architecture/infrastructure.md`, `docs/guides/deployment.md`, `docs/README.md`, `navigation.ts`; sinh lại `api-schema.gen.ts` bằng `pnpm api:types`; bổ sung `.playwright-cli`/`.next-verify` vào `frontend/.prettierignore`. Ghi nhận nợ kỹ thuật (CLI-only, `PASS` có chú thích) ở 4 seeder (`finance_seed_service.py`, `donation_seed_service.py`, `page_seed_service.py`, `short_link_seed_service.py`) còn gọi `.objects` trực tiếp.
  - **Đa ngôn ngữ (`i18n-audit`)**: Dọn 11 mã lỗi BE thừa trong `frontend/src/messages/{vi,en}.json`; thêm khóa `stackTrace`, `linkPlaceholder` (`/quan-tri` ↔ `/admin`), `defaultCtaLabel` (`Mua ngay` ↔ `Buy now`), nhãn múi giờ `+7` song ngữ trong `WorkspaceSettingForm`, dịch prompt preset trong `workspace/messages/en.json`; sửa hậu tố đồng hồ `/en` từ `SA`/`CH` sang `AM`/`PM` qua `useClock`/`ClockWidget` phát hiện khi kiểm tra ảnh giao diện thật.
  - **Phân quyền (`permission-audit`)**: Xác nhận đồng bộ 45 class quyền BE (164 mã quyền) ↔ 44 file quyền FE; sửa nút Sửa trong `PortalDashboard` dùng `withEditMode` khi có quyền `update`.
  - **Hệ thống theo dõi tăng dần**: Xây dựng `scripts/audit_tracker.py` + `docs/reports/code-audit-tracker.md`, tích hợp vào 12 skill (`.agents/skills/` ↔ `.claude/skills/`), `docs/rules/common.md`, `.agents/rules/01-workflow.md`, `.agents/rules/90-done-checklist.md`, `AGENTS.md`, `CLAUDE.md`, `prompt.md`.
- **Kiểm chứng**: BE `ruff format --check`/`ruff check`/`mypy` (`936` file), `spectacular --validate --fail-on-warn`, `makemigrations --check --dry-run`, `pytest --reuse-db` (`1.254 passed`); FE `eslint --max-warnings 0`, `prettier --check .`, `pnpm typecheck`, Vitest (`70` file / `826 passed`), Chromium headless trên `http://localhost:3001` (`vi`/`en`, desktop/`375px`, `ADMIN` & `portal.member`), `sync-ai-rules.py --check`, `check-workflow-skills.py`, `audit_tracker.py sync --check --strict-clean`.
<!-- AUDIT_LOG:END -->

## 4. Bảng theo dõi chi tiết từng file

<!-- AUDIT_TABLES:START -->
### Backend · Core (`backend/app/core`) (120 file)

| File | Loại | Thay đổi gần nhất | Thay đổi bởi / Commit | Code | Security | i18n | Permission | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `backend/app/core/__init__.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/cache/__init__.py` | be-module | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/cache/cache_service.py` | be-module | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/constants/__init__.py` | constant | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/constants/core_rate_limit_key.py` | constant | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/constants/defaults.py` | constant | 2026-11-25 | 2d18438 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/constants/error_codes.py` | constant | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/constants/module_code.py` | constant | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/constants/rate_limit_action.py` | constant | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/context/__init__.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/context/user_context.py` | be-module | 2026-11-19 | 79be1f9 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/decorators/__init__.py` | decorator | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/decorators/rate_limit.py` | decorator | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/decorators/validate_request.py` | decorator | 2026-11-19 | 79be1f9 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/exceptions/__init__.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/exceptions/app_exception.py` | be-module | 2026-11-15 | a079105 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/exceptions/authentication_error.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/exceptions/authorization_error.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/exceptions/business_rule_error.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/exceptions/conflict_error.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/exceptions/exception_handler.py` | be-module | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/exceptions/not_found_error.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/exceptions/rate_limit_error.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/exceptions/secret_cipher_error.py` | be-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/exceptions/validation_error.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/filters/__init__.py` | filter | 2026-11-15 | 0fb19eb | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/filters/core_boolean_in_filter.py` | filter | 2026-11-15 | a0e6900 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/filters/core_char_in_filter.py` | filter | 2026-11-15 | a0e6900 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/filters/core_choice_in_filter.py` | filter | 2026-11-15 | a0e6900 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/filters/core_in_filter_mixin.py` | filter | 2026-11-15 | a0e6900 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/filters/core_search_filter.py` | filter | 2026-11-15 | 57e39df | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/filters/core_uuid_in_filter.py` | filter | 2026-11-15 | a0e6900 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/logging/__init__.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/logging/request_context_filter.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/logging/step_timer.py` | be-module | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/middleware/__init__.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/middleware/request_context_middleware.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/models/__init__.py` | model | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/models/core_model.py` | model | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/models/core_query_set.py` | model | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/pagination/__init__.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/pagination/core_page_number_pagination.py` | be-module | 2026-11-15 | a0e6900 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/permissions/__init__.py` | permission | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/permissions/csrf_protected.py` | permission | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/permissions/is_active_authenticated.py` | permission | 2026-11-15 | a0e6900 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/registry/__init__.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/registry/callback_definition.py` | be-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/registry/core_module_config.py` | be-module | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/registry/module_descriptor.py` | be-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/registry/module_registry.py` | be-module | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/registry/notification_event_definition.py` | be-module | 2026-11-25 | 2d18438 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/registry/permission_catalog.py` | be-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/registry/permission_definition.py` | be-module | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/registry/webhook_definition.py` | be-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/repositories/__init__.py` | repository | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/repositories/core_repository.py` | repository | 2026-11-15 | 1555dd9 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/responses/__init__.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/responses/core_error_response.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/responses/core_pagination_response.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/responses/core_response.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/responses/response_body.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/schemas/__init__.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/schemas/core_auto_schema.py` | be-module | 2026-11-15 | a0e6900 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/schemas/response_envelope.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/security/__init__.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/security/csrf.py` | be-module | 2026-11-15 | 0fb19eb | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/security/secret_cipher.py` | be-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/serializers/__init__.py` | serializer | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/serializers/core_bulk_ids_validate_serializer.py` | serializer | 2026-11-15 | 0fb19eb | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/serializers/core_bulk_result_response_serializer.py` | serializer | 2026-11-15 | 0fb19eb | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/serializers/core_journal_entry_response_serializer.py` | serializer | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/core/serializers/core_validate_serializer.py` | serializer | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/services/__init__.py` | service | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/services/core_crud_service.py` | service | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/storage/__init__.py` | be-module | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/storage/r2_private_storage.py` | be-module | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/storage/r2_storage.py` | be-module | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/storage/r2_usage_service.py` | be-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/tests/__init__.py` | test | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/tests/base/__init__.py` | test | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/tests/base/base_api_test_case.py` | test | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/tests/helpers/__init__.py` | test | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/tests/helpers/fake_redis.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/tests/test_cache_service.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/tests/test_core_crud_service.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/tests/test_core_repository.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/tests/test_core_search_filter.py` | test | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/tests/test_csv_safety.py` | test | 2026-11-25 | 2d18438 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/tests/test_endpoint_access.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/tests/test_error_codes.py` | test | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/tests/test_list_query_count.py` | test | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/tests/test_module_conventions.py` | test | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/tests/test_module_registry.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/tests/test_one_class_per_file.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/tests/test_openapi_schema.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/tests/test_r2_storage.py` | test | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/tests/test_r2_usage_service.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/tests/test_request_limits.py` | test | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/tests/test_responses.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/tests/test_safe_http_client.py` | test | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/tests/test_settings.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/tests/test_step_timer.py` | test | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/tests/test_user_context.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/tracking/__init__.py` | be-module | 2026-11-15 | a0e6900 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/tracking/change_recorder.py` | be-module | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/tracking/change_set.py` | be-module | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/tracking/journal_tracker.py` | be-module | 2026-11-15 | db86873 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/tracking/recorder_registry.py` | be-module | 2026-11-15 | a0e6900 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/utils/__init__.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/utils/csv_safety.py` | be-module | 2026-11-25 | 2d18438 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/utils/pinned_http_adapter.py` | be-module | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/utils/safe_http_client.py` | be-module | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/utils/slug.py` | be-module | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/utils/text.py` | be-module | 2026-11-15 | 57e39df | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/utils/url.py` | be-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/validators/__init__.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/validators/core_validator.py` | be-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/views/__init__.py` | view | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/views/core_api_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/core/views/core_model_view_set.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |

### Backend · System (`backend/app/system`) (505 file)

| File | Loại | Thay đổi gần nhất | Thay đổi bởi / Commit | Code | Security | i18n | Permission | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `backend/app/system/__init__.py` | be-module | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/apps.py` | apps | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/authentications/__init__.py` | be-module | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/authentications/cookie_jwt_authentication.py` | be-module | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/backends/__init__.py` | be-module | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/backends/account_auth_backend.py` | be-module | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/backends/iam_permission_backend.py` | be-module | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/constants/__init__.py` | constant | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/constants/account_error_code.py` | constant | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/constants/attachment_error_code.py` | constant | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/constants/auth_frontend_routes.py` | constant | 2026-11-25 | 2d18438 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/constants/cloudflare_ip_ranges.py` | constant | 2026-11-22 | da96776 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/constants/currency_defaults.py` | constant | 2026-11-25 | 2d18438 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/constants/currency_error_code.py` | constant | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/constants/iam_error_code.py` | constant | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/constants/media_types.py` | constant | 2026-11-25 | 2d18438 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/constants/notification_channel.py` | constant | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/constants/notification_defaults.py` | constant | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/constants/notification_error_code.py` | constant | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/system/constants/notification_level.py` | constant | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/constants/notification_scope.py` | constant | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/constants/predefined_roles.py` | constant | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/constants/role_code.py` | constant | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/constants/setting_cache.py` | constant | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/constants/setting_key.py` | constant | 2026-11-27 | fc06142 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/constants/storage_cache.py` | constant | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/constants/system_notification_event.py` | constant | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/constants/system_rate_limit_key.py` | constant | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/decorators/__init__.py` | decorator | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/decorators/require_permission.py` | decorator | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/filters/__init__.py` | filter | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/filters/admin_auth_session_filter.py` | filter | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/filters/attachment_filter.py` | filter | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/filters/attachment_folder_filter.py` | filter | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/filters/currency_filter.py` | filter | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/filters/exchange_rate_filter.py` | filter | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/filters/journal_entry_filter.py` | filter | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/filters/notification_delivery_filter.py` | filter | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/filters/permission_filter.py` | filter | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/filters/role_filter.py` | filter | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/filters/setting_filter.py` | filter | 2026-11-27 | fc06142 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/filters/user_filter.py` | filter | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/management/__init__.py` | command | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/management/commands/__init__.py` | command | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/management/commands/createsuperuser.py` | command | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/management/commands/prepare_e2e.py` | command | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/management/commands/run_cleanup.py` | command | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/management/commands/seed_demo.py` | command | 2026-11-25 | 2d18438 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/management/commands/seed_local.py` | command | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/management/commands/seed_roles.py` | command | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/management/commands/seed_test_accounts.py` | command | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/management/commands/sync_iam.py` | command | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/migrations/0001_initial.py` | migration | 2026-11-20 | 3bfdedf | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/migrations/0002_unaccent_extension.py` | migration | 2026-11-20 | 3bfdedf | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/migrations/0003_alter_role_is_system_alter_user_avatar.py` | migration | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/migrations/0004_remove_user_first_name_remove_user_last_name_and_more.py` | migration | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/migrations/0005_add_user_email_verification.py` | migration | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/migrations/0006_usersocialaccount.py` | migration | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/migrations/0007_setting.py` | migration | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/migrations/0008_attachment_visibility.py` | migration | 2026-11-22 | be17cfe | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/migrations/0009_currency_exchangerate_notification_and_more.py` | migration | 2026-11-22 | be17cfe | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/migrations/0010_seed_currencies.py` | migration | 2026-11-22 | be17cfe | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/migrations/0011_remove_telegrambot_created_by_and_more.py` | migration | 2026-11-26 | 6d46e0f | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/migrations/__init__.py` | migration | 2026-11-20 | 3bfdedf | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/models/__init__.py` | model | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/models/attachment.py` | model | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/models/attachment_folder.py` | model | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/models/auth_session.py` | model | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/models/auth_session_status.py` | model | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/models/currency.py` | model | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/models/exchange_rate.py` | model | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/models/journal_entry.py` | model | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/models/notification.py` | model | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/models/notification_delivery.py` | model | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/models/notification_preference.py` | model | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/models/permission.py` | model | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/models/push_device.py` | model | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/models/rate_limit_bucket.py` | model | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/models/refresh_token.py` | model | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/models/role.py` | model | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/models/role_auto_grant.py` | model | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/models/role_permission.py` | model | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/models/setting.py` | model | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/models/system_announcement.py` | model | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/models/telegram_chat.py` | model | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/models/user.py` | model | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/models/user_manager.py` | model | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/models/user_role.py` | model | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/models/user_social_account.py` | model | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/module.py` | module | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/permissions/__init__.py` | permission | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/permissions/announcement_permission.py` | permission | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/permissions/attachment_folder_permission.py` | permission | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/permissions/attachment_permission.py` | permission | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/permissions/callback_permission.py` | permission | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/permissions/currency_permission.py` | permission | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/permissions/exchange_rate_permission.py` | permission | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/permissions/has_iam_permission.py` | permission | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/permissions/iam_permission.py` | permission | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/permissions/journal_entry_permission.py` | permission | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/permissions/notification_delivery_permission.py` | permission | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/permissions/notification_permission.py` | permission | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/permissions/notification_preference_permission.py` | permission | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/permissions/push_device_permission.py` | permission | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/permissions/session_permission.py` | permission | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/permissions/setting_permission.py` | permission | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/permissions/telegram_chat_permission.py` | permission | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/permissions/user_permission.py` | permission | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/permissions/webhook_permission.py` | permission | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/recorders/__init__.py` | be-module | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/recorders/journal_recorder.py` | be-module | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/system/repositories/__init__.py` | repository | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/repositories/attachment_folder_repository.py` | repository | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/repositories/attachment_repository.py` | repository | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/repositories/auth_session_repository.py` | repository | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/repositories/currency_repository.py` | repository | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/repositories/database_repository.py` | repository | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/repositories/exchange_rate_repository.py` | repository | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/repositories/journal_entry_repository.py` | repository | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/system/repositories/notification_delivery_repository.py` | repository | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/repositories/notification_preference_repository.py` | repository | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/repositories/notification_repository.py` | repository | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/repositories/permission_repository.py` | repository | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/repositories/push_device_repository.py` | repository | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/repositories/rate_limit_bucket_repository.py` | repository | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/repositories/refresh_token_repository.py` | repository | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/repositories/role_permission_repository.py` | repository | 2026-11-27 | b38d277 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/system/repositories/role_repository.py` | repository | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/repositories/setting_repository.py` | repository | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/repositories/system_announcement_repository.py` | repository | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/repositories/telegram_chat_repository.py` | repository | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/repositories/user_repository.py` | repository | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/system/repositories/user_role_repository.py` | repository | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/repositories/user_social_account_repository.py` | repository | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/schemas/__init__.py` | be-module | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/schemas/cookie_jwt_authentication_scheme.py` | be-module | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/__init__.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/__init__.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/admin_auth_session_response_serializer.py` | serializer | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/system/serializers/responses/admin_session_user_response_serializer.py` | serializer | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/attachment_detail_response_serializer.py` | serializer | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/attachment_folder_response_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/attachment_summary_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/callback_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/cleanup_response_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/csrf_response_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/currency_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/current_user_response_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/exchange_rate_resolve_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/exchange_rate_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/health_response_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/invitation_detail_response_serializer.py` | serializer | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/journal_resource_response_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/logout_all_response_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/notification_delivery_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/notification_dispatch_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/notification_event_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/notification_preference_item_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/notification_preference_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/notification_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/notification_unread_count_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/password_reset_detail_response_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/password_reset_token_valid_response_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/permission_list_response_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/public_setting_response_serializer.py` | serializer | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/push_device_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/readiness_response_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/role_detail_response_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/role_list_response_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/role_summary_response_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/session_list_response_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/setting_response_serializer.py` | serializer | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/social_auth_url_response_serializer.py` | serializer | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/social_unlink_response_serializer.py` | serializer | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/system_announcement_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/telegram_bot_check_response_serializer.py` | serializer | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/telegram_bot_response_serializer.py` | serializer | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/telegram_chat_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/telegram_registration_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/user_connected_social_summary_response_serializer.py` | serializer | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/user_detail_response_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/user_list_response_serializer.py` | serializer | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/user_social_account_summary_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/responses/webhook_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/__init__.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/accept_invitation_validate_serializer.py` | serializer | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/attachment_bulk_update_validate_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/attachment_folder_delete_validate_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/attachment_folder_update_validate_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/attachment_folder_validate_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/attachment_update_validate_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/attachment_upload_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/attachment_visibility_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/client_error_report_validate_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/currency_bulk_update_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/currency_update_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/currency_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/email_verification_validate_serializer.py` | serializer | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/exchange_rate_fetch_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/exchange_rate_resolve_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/exchange_rate_update_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/exchange_rate_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/login_validate_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/me_update_validate_serializer.py` | serializer | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/notification_list_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/notification_preference_item_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/notification_preference_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/notification_read_all_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/password_reset_confirm_validate_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/password_reset_request_validate_serializer.py` | serializer | 2026-11-25 | 2d18438 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/password_reset_validate_token_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/push_device_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/role_bulk_update_validate_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/role_create_validate_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/role_permission_assign_validate_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/role_permission_sync_validate_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/role_update_validate_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/setting_create_validate_serializer.py` | serializer | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/setting_update_validate_serializer.py` | serializer | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/social_auth_code_validate_serializer.py` | serializer | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/social_auth_url_validate_serializer.py` | serializer | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/system_announcement_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/telegram_chat_update_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/telegram_registration_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/user_bulk_update_validate_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/user_create_validate_serializer.py` | serializer | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/user_role_assign_validate_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/user_role_sync_validate_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/serializers/validates/user_update_validate_serializer.py` | serializer | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/__init__.py` | service | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/access_token_service.py` | service | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/account_seed_service.py` | service | 2026-11-25 | 2d18438 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/admin_auth_session_service.py` | service | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/attachment_folder_service.py` | service | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/attachment_purge_service.py` | service | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/attachment_service.py` | service | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/attachment_storage_service.py` | service | 2026-11-25 | 2d18438 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/auth_cookie_service.py` | service | 2026-11-22 | 4ac3ac8 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/auth_service.py` | service | 2026-11-22 | 4ac3ac8 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/auth_session_service.py` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/callback_catalog_service.py` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/cleanup_service.py` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/currency_service.py` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/current_user_service.py` | service | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/database_usage_service.py` | service | 2026-11-22 | cd12f82 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/email_service.py` | service | 2026-11-25 | 2d18438 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/email_verification_service.py` | service | 2026-11-25 | 2d18438 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/exchange_rate_service.py` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/fcm_client.py` | service | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/github_oauth_service.py` | service | 2026-11-27 | b38d277 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/system/services/google_oauth_service.py` | service | 2026-11-27 | b38d277 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/system/services/health_service.py` | service | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/iam_sync_service.py` | service | 2026-11-27 | b38d277 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/system/services/journal_entry_service.py` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/login_notification_service.py` | service | 2026-11-27 | fc06142 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/notification_delivery_service.py` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/notification_dispatcher.py` | service | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/notification_kick_service.py` | service | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/notification_message_formatter.py` | service | 2026-11-22 | cd12f82 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/notification_preference_service.py` | service | 2026-11-27 | working-tree (UU) | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/system/services/notification_service.py` | service | 2026-11-27 | working-tree (UU) | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/system/services/oauth_provider_service.py` | service | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/oauth_service.py` | service | 2026-11-25 | 2d18438 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/password_reset_service.py` | service | 2026-11-25 | 2d18438 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/permission_checker.py` | service | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/permission_service.py` | service | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/push_device_service.py` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/qstash_client.py` | service | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/rate_limit_service.py` | service | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/refresh_token_service.py` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/role_permission_service.py` | service | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/role_seed_service.py` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/role_service.py` | service | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/setting_service.py` | service | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/system_announcement_service.py` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/telegram_bot_service.py` | service | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/system/services/telegram_chat_service.py` | service | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/telegram_client.py` | service | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/system/services/telegram_webhook_service.py` | service | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/user_invitation_service.py` | service | 2026-11-25 | 2d18438 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/user_role_service.py` | service | 2026-11-25 | 2d18438 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/user_service.py` | service | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/system/services/vietcombank_rate_client.py` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/services/webhook_catalog_service.py` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/signals.py` | be-module | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tasks/__init__.py` | task | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tasks/check_database_size.py` | task | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tasks/dispatch_notifications.py` | task | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tasks/purge_deleted_files.py` | task | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tasks/purge_expired_auth.py` | task | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tasks/purge_journal.py` | task | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tasks/purge_notifications.py` | task | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/templates/system/email/email_verification_en.html` | be-module | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/templates/system/email/email_verification_en.txt` | be-module | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/templates/system/email/email_verification_vi.html` | be-module | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/templates/system/email/email_verification_vi.txt` | be-module | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/templates/system/email/invitation_en.html` | be-module | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/templates/system/email/invitation_en.txt` | be-module | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/templates/system/email/invitation_vi.html` | be-module | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/templates/system/email/invitation_vi.txt` | be-module | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/templates/system/email/password_reset_en.html` | be-module | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/templates/system/email/password_reset_en.txt` | be-module | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/templates/system/email/password_reset_vi.html` | be-module | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/templates/system/email/password_reset_vi.txt` | be-module | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/__init__.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/factories/__init__.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/factories/role_factory.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/factories/staff_factory.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/factories/superuser_factory.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/factories/user_factory.py` | test | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/factories/user_social_account_factory.py` | test | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/helpers/__init__.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/helpers/attachment_test_helper.py` | test | 2026-11-25 | 2d18438 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/helpers/permission_helper.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/helpers/qstash_helper.py` | test | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_account_auth_backend.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_admin_session_bulk_delete_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_admin_session_bulk_revoke_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_admin_session_list_api.py` | test | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/system/tests/test_admin_session_revoke_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_admin_session_user_choices_api.py` | test | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_announcement_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_attachment_bulk_delete_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_attachment_bulk_update_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_attachment_content_api.py` | test | 2026-11-25 | 2d18438 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_attachment_create_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_attachment_delete_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_attachment_detail_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_attachment_folders.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_attachment_list_api.py` | test | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_attachment_purge.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_attachment_storage_usage.py` | test | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_attachment_update_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_attachment_user_avatar_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_attachment_visibility_api.py` | test | 2026-11-25 | 2d18438 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_callback_list_api.py` | test | 2026-11-25 | 2d18438 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_cleanup.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_client_error_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_client_ip.py` | test | 2026-11-22 | ef5d024 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_csrf_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_currency_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_currency_bulk_delete_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_currency_bulk_update_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_database_usage_service.py` | test | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_default_ordering.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_email_verification_send_api.py` | test | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_email_verification_verify_api.py` | test | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_exchange_rate_bulk_delete_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_exchange_rate_resolve_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_fcm_client.py` | test | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_health_api.py` | test | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_iam_access.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_iam_sync_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_journal_entry_bulk_delete_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_journal_entry_delete_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_journal_entry_detail_api.py` | test | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/system/tests/test_journal_entry_list_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_journal_resource_list_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_journal_tracker.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_login_api.py` | test | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_login_notification.py` | test | 2026-11-27 | fc06142 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_logout_all_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_logout_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_me_api.py` | test | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_media_signatures.py` | test | 2026-11-27 | b38d277 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/system/tests/test_notification_delivery_bulk_delete_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_notification_delivery_delete_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_notification_dispatch_api.py` | test | 2026-11-27 | working-tree (MM) | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/system/tests/test_notification_kick_service.py` | test | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_notification_list_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_notification_message_formatter.py` | test | 2026-11-22 | cd12f82 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_notification_preference_api.py` | test | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_notification_service.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_password_reset_confirm_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_password_reset_request_api.py` | test | 2026-11-25 | 2d18438 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_password_reset_validate_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_permission_checker.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_permission_list_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_permission_rule.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_public_setting_api.py` | test | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_qstash_client.py` | test | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_rate_limit_service.py` | test | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_refresh_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_role_assign_permission_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_role_bulk_delete_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_role_bulk_update_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_role_create_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_role_delete_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_role_list_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_role_revoke_permission_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_role_seed_service.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_role_update_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_security_hardening.py` | test | 2026-11-27 | b38d277 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/system/tests/test_seed_local.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_seed_test_accounts.py` | test | 2026-11-25 | 2d18438 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_session_delete_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_session_list_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_setting_bulk_delete_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_setting_list_api.py` | test | 2026-11-27 | fc06142 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_setting_update_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_social_account_list_api.py` | test | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_social_auth_url_api.py` | test | 2026-11-25 | 2d18438 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_social_link_api.py` | test | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_social_login_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_social_unlink_api.py` | test | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_system_announcement_bulk_delete_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_system_telegram_webhook_api.py` | test | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_telegram_bot_api.py` | test | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/system/tests/test_user_agent.py` | test | 2026-11-22 | cd12f82 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_user_bulk_delete_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_user_bulk_update_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_user_create_api.py` | test | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_user_delete_api.py` | test | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_user_detail_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_user_invitation_accept_api.py` | test | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_user_invitation_validate_api.py` | test | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_user_list_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_user_role_assign_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_user_role_filter.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_user_role_revoke_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_user_update_api.py` | test | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/tests/test_webhook_list_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/throttles/__init__.py` | be-module | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/throttles/bucket_throttle.py` | be-module | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/types/__init__.py` | be-module | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/types/access_claims.py` | be-module | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/types/auth_result.py` | be-module | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/types/current_user_profile.py` | be-module | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/types/fetched_rate.py` | be-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/types/notification_payload.py` | be-module | 2026-11-22 | cd12f82 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/types/oauth_user_info.py` | be-module | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/types/permission_rule.py` | be-module | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/types/predefined_role_spec.py` | be-module | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/types/push_send_result.py` | be-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/types/resolved_channels.py` | be-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/types/rotated_token.py` | be-module | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/types/telegram_send_result.py` | be-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/urls.py` | urls | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/utils/__init__.py` | be-module | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/utils/client_ip.py` | be-module | 2026-11-22 | ef5d024 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/utils/file_signature.py` | be-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/utils/frontend_url.py` | be-module | 2026-11-25 | 2d18438 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/utils/svg_inspector.py` | be-module | 2026-11-27 | b38d277 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/system/utils/user_agent.py` | be-module | 2026-11-22 | cd12f82 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/validators/__init__.py` | be-module | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/validators/password_validator.py` | be-module | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/__init__.py` | view | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/accept_invitation_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/admin_auth_session_view_set.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/attachment_content_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/attachment_folder_delete_view.py` | view | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/attachment_folder_view_set.py` | view | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/attachment_view_set.py` | view | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/attachment_visibility_view.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/callback_view.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/cleanup_view.py` | view | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/client_error_view.py` | view | 2026-11-27 | b38d277 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/system/views/csrf_view.py` | view | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/currency_view_set.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/exchange_rate_fetch_view.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/exchange_rate_resolve_view.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/exchange_rate_view_set.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/health_view.py` | view | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/invitation_validate_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/journal_entry_view_set.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/journal_resource_view.py` | view | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/login_view.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/logout_all_view.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/logout_view.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/me_view.py` | view | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/notification_delivery_retry_view.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/notification_delivery_view_set.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/notification_dispatch_view.py` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/notification_preference_view.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/notification_read_view.py` | view | 2026-11-25 | 2d18438 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/notification_unread_count_view.py` | view | 2026-11-25 | 2d18438 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/notification_view.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/password_reset_confirm_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/password_reset_request_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/password_reset_validate_token_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/permission_view_set.py` | view | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/public_setting_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/push_device_view.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/readiness_view.py` | view | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/refresh_view.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/role_permission_view.py` | view | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/role_view_set.py` | view | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/send_verification_email_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/session_view.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/setting_view_set.py` | view | 2026-11-27 | fc06142 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/social_auth_url_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/social_link_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/social_login_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/social_unlink_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/system_announcement_view_set.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/system_telegram_webhook_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/telegram_bot_check_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/telegram_bot_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/telegram_chat_action_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/telegram_chat_view_set.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/user_role_view.py` | view | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/user_social_account_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/user_view_set.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/verify_email_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/system/views/webhook_view.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |

### Backend · Utilities (`backend/app/utilities`) (180 file)

| File | Loại | Thay đổi gần nhất | Thay đổi bởi / Commit | Code | Security | i18n | Permission | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `backend/app/utilities/__init__.py` | be-module | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/apps.py` | apps | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/constants/__init__.py` | constant | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/constants/affiliate_platform.py` | constant | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/constants/donation_constants.py` | constant | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/constants/page_templates.py` | constant | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/constants/public_cache.py` | constant | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/constants/utilities_error_code.py` | constant | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/constants/utilities_rate_limit_key.py` | constant | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/constants/vietqr_banks.py` | constant | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/exceptions/__init__.py` | be-module | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/exceptions/short_link_expired_error.py` | be-module | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/exceptions/short_link_password_error.py` | be-module | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/filters/__init__.py` | filter | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/filters/donation_transaction_filter.py` | filter | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/filters/page_filter.py` | filter | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/filters/page_path_filter.py` | filter | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/filters/qr_code_filter.py` | filter | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/filters/short_link_filter.py` | filter | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/management/__init__.py` | command | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/management/commands/__init__.py` | command | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/management/commands/seed_donations.py` | command | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/management/commands/seed_pages.py` | command | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/management/commands/seed_short_links.py` | command | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/migrations/0001_initial.py` | migration | 2026-11-20 | 3bfdedf | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/migrations/0002_seed_page_paths.py` | migration | 2026-11-20 | d2cb772 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/migrations/0003_shortlink_clicks_count_shortlink_last_accessed_at_and_more.py` | migration | 2026-11-22 | ee7f12d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/migrations/0004_page_content_config_page_page_type_and_more.py` | migration | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/migrations/0005_donationtransaction.py` | migration | 2026-11-25 | 93e6312 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/migrations/__init__.py` | migration | 2026-11-20 | d2cb772 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/models/__init__.py` | model | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/models/donation_transaction.py` | model | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/models/page.py` | model | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/models/page_path.py` | model | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/models/qr_code.py` | model | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/models/short_link.py` | model | 2026-11-22 | ee7f12d | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/module.py` | module | 2026-11-25 | 232742f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/permissions/__init__.py` | permission | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/permissions/donation_permission.py` | permission | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/permissions/page_path_permission.py` | permission | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/permissions/page_permission.py` | permission | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/permissions/qr_code_permission.py` | permission | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/permissions/short_link_permission.py` | permission | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/repositories/__init__.py` | repository | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/repositories/donation_transaction_repository.py` | repository | 2026-11-25 | 232742f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/repositories/page_path_repository.py` | repository | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/repositories/page_repository.py` | repository | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/repositories/qr_code_repository.py` | repository | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/repositories/short_link_repository.py` | repository | 2026-11-22 | ee7f12d | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/__init__.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/responses/__init__.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/responses/donation_public_feed_response_serializer.py` | serializer | 2026-11-25 | 232742f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/responses/donation_public_leaderboard_response_serializer.py` | serializer | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/responses/donation_stats_response_serializer.py` | serializer | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/responses/donation_transaction_response_serializer.py` | serializer | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/responses/page_detail_response_serializer.py` | serializer | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/responses/page_list_response_serializer.py` | serializer | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/responses/page_metadata_response_serializer.py` | serializer | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/responses/page_owner_response_serializer.py` | serializer | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/utilities/serializers/responses/page_path_response_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/responses/page_path_summary_response_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/responses/page_public_response_serializer.py` | serializer | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/responses/qr_bank_response_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/responses/qr_code_detail_response_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/responses/qr_code_list_response_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/responses/qr_code_owner_response_serializer.py` | serializer | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/utilities/serializers/responses/qr_preview_response_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/responses/short_link_destination_response_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/responses/short_link_detail_response_serializer.py` | serializer | 2026-11-22 | ee7f12d | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/responses/short_link_list_response_serializer.py` | serializer | 2026-11-22 | ee7f12d | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/responses/short_link_owner_response_serializer.py` | serializer | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/utilities/serializers/responses/short_link_public_response_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/validates/__init__.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/validates/donation_bulk_update_validate_serializer.py` | serializer | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/validates/donation_toggle_validate_serializer.py` | serializer | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/validates/page_bulk_update_validate_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/validates/page_create_validate_serializer.py` | serializer | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/validates/page_fetch_metadata_validate_serializer.py` | serializer | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/validates/page_path_bulk_update_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/validates/page_path_create_validate_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/validates/page_path_update_validate_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/validates/page_update_validate_serializer.py` | serializer | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/validates/qr_bank_transfer_data_validate_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/validates/qr_code_create_validate_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/validates/qr_code_update_validate_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/validates/qr_preview_validate_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/validates/qr_style_validate_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/validates/qr_text_data_validate_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/validates/qr_url_data_validate_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/validates/short_link_bulk_update_validate_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/validates/short_link_create_validate_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/validates/short_link_unlock_validate_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/serializers/validates/short_link_update_validate_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/services/__init__.py` | service | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/services/donation_content_filter.py` | service | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/services/donation_gift_classifier.py` | service | 2026-11-25 | 232742f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/services/donation_seed_service.py` | service | 2026-11-25 | 232742f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã kiểm (CLI seeder nội bộ, ghi nhận nợ kỹ thuật tách ORM sang Repository) |
| `backend/app/utilities/services/donation_transaction_service.py` | service | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/utilities/services/link_metadata_service.py` | service | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/services/page_path_service.py` | service | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/services/page_seed_service.py` | service | 2026-11-25 | 232742f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã kiểm (CLI seeder nội bộ, ghi nhận nợ kỹ thuật tách ORM sang Repository) |
| `backend/app/utilities/services/page_service.py` | service | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/services/qr_code_service.py` | service | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/services/short_link_seed_service.py` | service | 2026-11-25 | 232742f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã kiểm (CLI seeder nội bộ, ghi nhận nợ kỹ thuật tách ORM sang Repository) |
| `backend/app/utilities/services/short_link_service.py` | service | 2026-11-22 | ee7f12d | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/__init__.py` | test | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/factories/__init__.py` | test | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/factories/short_link_factory.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/helpers/__init__.py` | test | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/helpers/page_test_helper.py` | test | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/helpers/qr_test_helper.py` | test | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_donation_content_filter.py` | test | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_donation_export_api.py` | test | 2026-11-25 | 232742f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_donation_gift_classifier.py` | test | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_donation_list_api.py` | test | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_donation_public_feed_api.py` | test | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_donation_public_leaderboard_api.py` | test | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_donation_stats_api.py` | test | 2026-11-25 | 232742f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_donation_webhook_api.py` | test | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_page_bulk_delete_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_page_bulk_update_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_page_create_api.py` | test | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_page_delete_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_page_detail_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_page_duplicate_api.py` | test | 2026-11-25 | 232742f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_page_fetch_metadata_api.py` | test | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_page_history_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_page_list_api.py` | test | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/utilities/tests/test_page_path_bulk_delete_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_page_path_bulk_update_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_page_path_create_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_page_path_delete_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_page_path_detail_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_page_path_list_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_page_path_update_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_page_public_api.py` | test | 2026-11-25 | 232742f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_page_template_crud_api.py` | test | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_page_update_api.py` | test | 2026-11-25 | 232742f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_qr_code_banks_api.py` | test | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_qr_code_bulk_delete_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_qr_code_create_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_qr_code_delete_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_qr_code_detail_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_qr_code_history_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_qr_code_list_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_qr_code_preview_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_qr_code_update_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_short_link_bulk_delete_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_short_link_bulk_update_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_short_link_create_api.py` | test | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_short_link_delete_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_short_link_detail_api.py` | test | 2026-11-25 | 232742f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_short_link_history_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_short_link_list_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_short_link_resolve_api.py` | test | 2026-11-22 | ee7f12d | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_short_link_update_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_slug_concurrency.py` | test | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/tests/test_vietqr_payload.py` | test | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/urls.py` | urls | 2026-11-25 | 232742f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/utils/__init__.py` | be-module | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/utils/metadata_html_parser.py` | be-module | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/utils/qr_content.py` | be-module | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/utils/qr_image_renderer.py` | be-module | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/utils/vietqr_payload.py` | be-module | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/validators/__init__.py` | be-module | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/validators/page_content_validator.py` | be-module | 2026-11-25 | 232742f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/validators/theme_validator.py` | be-module | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/views/__init__.py` | view | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/views/donation_public_feed_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/views/donation_public_leaderboard_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/views/donation_transaction_view_set.py` | view | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/views/donation_webhook_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/views/page_path_view_set.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/views/page_public_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/views/page_view_set.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/views/qr_bank_view.py` | view | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/views/qr_code_view_set.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/views/qr_preview_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/views/short_link_resolve_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/utilities/views/short_link_view_set.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |

### Backend · Novel (`backend/app/novel`) (130 file)

| File | Loại | Thay đổi gần nhất | Thay đổi bởi / Commit | Code | Security | i18n | Permission | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `backend/app/novel/__init__.py` | be-module | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/apps.py` | apps | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/constants/novel_error_code.py` | constant | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/constants/novel_rate_limit_key.py` | constant | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/filters/chapter_filter.py` | filter | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/filters/novel_filter.py` | filter | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/migrations/0001_initial.py` | migration | 2026-11-20 | 3bfdedf | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/migrations/0002_alter_author_avatar.py` | migration | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/migrations/__init__.py` | migration | 2026-11-20 | d2cb772 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/models/__init__.py` | model | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/models/author.py` | model | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/models/chapter.py` | model | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/models/favorite.py` | model | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/models/genre.py` | model | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/models/novel.py` | model | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/models/reading_history.py` | model | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/models/tag.py` | model | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/module.py` | module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/permissions/__init__.py` | permission | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/permissions/author_permission.py` | permission | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/permissions/chapter_permission.py` | permission | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/permissions/genre_permission.py` | permission | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/permissions/novel_permission.py` | permission | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/permissions/tag_permission.py` | permission | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/repositories/author_repository.py` | repository | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/repositories/chapter_repository.py` | repository | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/repositories/favorite_repository.py` | repository | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/repositories/genre_repository.py` | repository | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/repositories/novel_repository.py` | repository | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/repositories/reading_history_repository.py` | repository | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/repositories/tag_repository.py` | repository | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/serializers/responses/author_summary_response_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/serializers/responses/chapter_detail_response_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/serializers/responses/chapter_list_response_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/serializers/responses/favorite_response_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/serializers/responses/favorite_toggle_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/serializers/responses/genre_summary_response_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/serializers/responses/novel_client_detail_response_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/serializers/responses/novel_detail_response_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/serializers/responses/novel_import_result_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/serializers/responses/novel_import_template_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/serializers/responses/novel_list_response_serializer.py` | serializer | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/serializers/responses/reading_history_clear_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/serializers/responses/reading_history_delete_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/serializers/responses/reading_history_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/serializers/responses/tag_summary_response_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/serializers/validates/author_update_validate_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/serializers/validates/author_validate_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/serializers/validates/chapter_bulk_update_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/serializers/validates/chapter_create_validate_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/serializers/validates/chapter_update_validate_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/serializers/validates/favorite_toggle_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/serializers/validates/genre_update_validate_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/serializers/validates/genre_validate_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/serializers/validates/novel_bulk_update_validate_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/serializers/validates/novel_chapter_import_item_serializer.py` | serializer | 2026-11-27 | b38d277 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/novel/serializers/validates/novel_create_validate_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/serializers/validates/novel_import_validate_serializer.py` | serializer | 2026-11-27 | b38d277 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/novel/serializers/validates/novel_info_import_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/serializers/validates/novel_update_validate_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/serializers/validates/reading_history_record_validate_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/serializers/validates/tag_update_validate_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/serializers/validates/tag_validate_serializer.py` | serializer | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/services/author_service.py` | service | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/services/chapter_service.py` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/services/favorite_service.py` | service | 2026-11-25 | 89a4755 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/services/genre_service.py` | service | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/services/novel_import_service.py` | service | 2026-11-25 | 89a4755 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/services/novel_service.py` | service | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/services/reading_history_service.py` | service | 2026-11-25 | 89a4755 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/services/tag_service.py` | service | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/factories/__init__.py` | test | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/factories/author_factory.py` | test | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/factories/chapter_factory.py` | test | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/factories/genre_factory.py` | test | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/factories/novel_factory.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/factories/tag_factory.py` | test | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_author_bulk_delete_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_author_create_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_author_delete_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_author_detail_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_author_list_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_author_update_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_chapter_bulk_delete_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_chapter_bulk_update_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_chapter_create_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_chapter_delete_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_chapter_detail_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_chapter_list_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_chapter_update_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_favorite_list_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_favorite_toggle_api.py` | test | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_genre_bulk_delete_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_genre_create_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_genre_delete_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_genre_detail_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_genre_list_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_genre_update_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_novel_bulk_delete_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_novel_client_chapter_api.py` | test | 2026-11-25 | 89a4755 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_novel_client_detail_api.py` | test | 2026-11-25 | 89a4755 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_novel_create_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_novel_delete_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_novel_detail_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_novel_import_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_novel_import_template_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_novel_list_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_novel_update_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_reading_history_clear_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_reading_history_create_api.py` | test | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_reading_history_delete_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_reading_history_list_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_tag_bulk_delete_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_tag_create_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_tag_delete_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_tag_detail_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_tag_list_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/tests/test_tag_update_api.py` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/urls.py` | urls | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/views/author_view_set.py` | view | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/views/chapter_client_view.py` | view | 2026-11-25 | 89a4755 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/views/chapter_view_set.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/views/favorite_view.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/views/genre_view_set.py` | view | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/views/novel_client_view.py` | view | 2026-11-25 | 89a4755 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/views/novel_import_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/views/novel_view_set.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/views/reading_history_object_view.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/views/reading_history_view.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/novel/views/tag_view_set.py` | view | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |

### Backend · Finance (`backend/app/finance`) (160 file)

| File | Loại | Thay đổi gần nhất | Thay đổi bởi / Commit | Code | Security | i18n | Permission | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `backend/app/finance/__init__.py` | be-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/apps.py` | apps | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/constants/__init__.py` | constant | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/constants/default_platforms.py` | constant | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/constants/finance_choices.py` | constant | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/constants/finance_defaults.py` | constant | 2026-11-25 | 873636e | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/constants/finance_error_code.py` | constant | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/constants/finance_notification_event.py` | constant | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/constants/finance_rate_limit_key.py` | constant | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/constants/sepay_api.py` | constant | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/exceptions/__init__.py` | be-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/exceptions/sepay_api_error.py` | be-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/filters/__init__.py` | filter | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/filters/classification_rule_filter.py` | filter | 2026-11-25 | 873636e | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/filters/income_filter.py` | filter | 2026-11-25 | 873636e | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/filters/invoice_filter.py` | filter | 2026-11-25 | 873636e | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/filters/platform_filter.py` | filter | 2026-11-25 | 873636e | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/management/commands/seed_finance.py` | command | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/migrations/0001_initial.py` | migration | 2026-11-22 | be17cfe | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/migrations/0002_seed_default_platforms.py` | migration | 2026-11-22 | be17cfe | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/migrations/0003_platform_color.py` | migration | 2026-11-27 | 1a5bc08 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/migrations/__init__.py` | migration | 2026-11-22 | be17cfe | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/models/__init__.py` | model | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/models/classification_rule.py` | model | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/models/income.py` | model | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/models/invoice.py` | model | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/models/platform.py` | model | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/models/platform_tax_rate.py` | model | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/models/sepay_connection.py` | model | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/module.py` | module | 2026-11-25 | 873636e | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/permissions/__init__.py` | permission | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/permissions/income_permission.py` | permission | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/permissions/invoice_permission.py` | permission | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/permissions/platform_permission.py` | permission | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/permissions/report_permission.py` | permission | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/permissions/rule_permission.py` | permission | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/permissions/sepay_permission.py` | permission | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/repositories/__init__.py` | repository | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/repositories/classification_rule_repository.py` | repository | 2026-11-25 | 873636e | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/repositories/income_repository.py` | repository | 2026-11-25 | 873636e | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/repositories/invoice_repository.py` | repository | 2026-11-25 | 873636e | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/repositories/platform_repository.py` | repository | 2026-11-25 | 873636e | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/repositories/platform_tax_rate_repository.py` | repository | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/repositories/sepay_connection_repository.py` | repository | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/__init__.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/responses/__init__.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/responses/classification_rule_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/responses/income_bulk_result_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/responses/income_response_serializer.py` | serializer | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/finance/serializers/responses/invoice_response_serializer.py` | serializer | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/finance/serializers/responses/platform_response_serializer.py` | serializer | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/responses/platform_seed_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/responses/platform_tax_rate_mutation_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/responses/platform_tax_rate_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/responses/report_currency_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/responses/report_month_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/responses/report_monthly_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/responses/report_platform_month_response_serializer.py` | serializer | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/responses/report_platform_response_serializer.py` | serializer | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/responses/report_summary_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/responses/report_summary_totals_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/responses/report_totals_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/responses/rule_test_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/responses/sepay_import_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/responses/sepay_preview_row_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/responses/sepay_status_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/responses/sepay_test_response_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/validates/__init__.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/validates/classification_rule_bulk_update_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/validates/classification_rule_update_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/validates/classification_rule_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/validates/income_recalculate_tax_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/validates/income_reclassify_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/validates/income_update_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/validates/income_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/validates/invoice_update_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/validates/invoice_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/validates/platform_bulk_update_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/validates/platform_tax_rate_resolve_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/validates/platform_tax_rate_update_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/validates/platform_tax_rate_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/validates/platform_update_validate_serializer.py` | serializer | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/validates/platform_validate_serializer.py` | serializer | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/validates/report_monthly_validate_serializer.py` | serializer | 2026-11-25 | 873636e | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/validates/report_summary_validate_serializer.py` | serializer | 2026-11-25 | 873636e | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/validates/rule_test_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/validates/sepay_connection_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/validates/sepay_import_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/serializers/validates/sepay_range_validate_serializer.py` | serializer | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/services/__init__.py` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/services/classification_engine.py` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/services/classification_rule_service.py` | service | 2026-11-25 | 873636e | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/services/currency_converter.py` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/services/finance_report_service.py` | service | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/services/finance_seed_service.py` | service | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã kiểm (CLI seeder nội bộ, ghi nhận nợ kỹ thuật tách ORM sang Repository) |
| `backend/app/finance/services/income_service.py` | service | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/finance/services/invoice_service.py` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/services/platform_service.py` | service | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/services/platform_tax_rate_service.py` | service | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/services/sepay_api_client.py` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/services/sepay_connection_service.py` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/services/sepay_import_service.py` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/services/sepay_transaction_parser.py` | service | 2026-11-25 | 873636e | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/services/sepay_webhook_service.py` | service | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/services/tax_withholding_calculator.py` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/tests/__init__.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/tests/conftest.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/tests/helpers/__init__.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/tests/helpers/finance_test_helper.py` | test | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/tests/scenarios/__init__.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/tests/scenarios/finance_2026.py` | test | 2026-11-26 | a427f8d | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/tests/test_classification_rule_bulk_delete_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/tests/test_classification_rule_bulk_update_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/tests/test_currency_converter.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/tests/test_finance_report_summary_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/tests/test_income_api.py` | test | 2026-11-25 | 873636e | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/tests/test_income_export_api.py` | test | 2026-11-25 | 873636e | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/tests/test_invoice_api.py` | test | 2026-11-25 | 873636e | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/tests/test_invoice_bulk_delete_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/tests/test_platform_bulk_delete_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/tests/test_platform_bulk_update_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/tests/test_platform_color_and_seed_api.py` | test | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/tests/test_platform_tax_rate_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/tests/test_rule_test_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/tests/test_sepay_import_api.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/tests/test_sepay_webhook_api.py` | test | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/tests/test_tax_withholding_calculator.py` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/types/__init__.py` | be-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/types/conversion_result.py` | be-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/types/incoming_sepay_transaction.py` | be-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/types/rule_match.py` | be-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/types/sepay_preview_row.py` | be-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/types/tax_result.py` | be-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/urls.py` | urls | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/utils/__init__.py` | be-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/utils/content_normalizer.py` | be-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/utils/money_format.py` | be-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/utils/parse_uuid_list.py` | be-module | 2026-11-25 | 873636e | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/utils/vn_time.py` | be-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/views/__init__.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/views/classification_rule_view_set.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/views/income_export_view.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/views/income_recalculate_tax_view.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/views/income_reclassify_view.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/views/income_refresh_rate_view.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/views/income_view_set.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/views/invoice_view_set.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/views/platform_seed_view.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/views/platform_tax_rate_resolve_view.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/views/platform_tax_rate_view.py` | view | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/views/platform_view_set.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/views/report_monthly_view.py` | view | 2026-11-25 | 873636e | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/views/report_summary_view.py` | view | 2026-11-25 | 873636e | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/views/rule_test_view.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/views/sepay_connection_test_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/views/sepay_connection_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/views/sepay_import_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/views/sepay_preview_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/views/sepay_secret_rotate_view.py` | view | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/finance/views/sepay_webhook_view.py` | view | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |

### Backend · Workspace (`backend/app/workspace`) (184 file)

| File | Loại | Thay đổi gần nhất | Thay đổi bởi / Commit | Code | Security | i18n | Permission | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `backend/app/workspace/__init__.py` | be-module | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/apps.py` | apps | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/constants/assistant_launcher_size.py` | constant | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/constants/group_tool_policy.py` | constant | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/constants/workspace_defaults.py` | constant | 2026-11-27 | working-tree (UU) | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/constants/workspace_error_code.py` | constant | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/constants/workspace_notification_event.py` | constant | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/constants/workspace_rate_limit_key.py` | constant | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/filters/__init__.py` | filter | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/filters/asset_filter.py` | filter | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/filters/asset_warranty_claim_filter.py` | filter | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/filters/reminder_filter.py` | filter | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/filters/subscription_filter.py` | filter | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/filters/subscription_payment_filter.py` | filter | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/filters/vault_item_filter.py` | filter | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/management/__init__.py` | command | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/management/commands/__init__.py` | command | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/management/commands/poll_telegram_assistant.py` | command | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/migrations/0001_initial.py` | migration | 2026-11-27 | working-tree (M) | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `backend/app/workspace/migrations/0002_workspacesetting_assistant_avatar_and_more.py` | migration | 2026-11-27 | c53d1ab | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/migrations/0003_remove_uptime_and_add_notification_channels.py` | migration | 2026-11-27 | 87f3761 | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `backend/app/workspace/migrations/0004_seed_assistant_default_policy.py` | migration | 2026-11-27 | c53d1ab | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/migrations/0005_remove_notification_channels.py` | migration | 2026-11-27 | 87f3761 | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `backend/app/workspace/migrations/0006_remove_workspacesetting_uq_workspace_setting_owner_and_more.py` | migration | 2026-11-27 | working-tree (??) | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `backend/app/workspace/migrations/__init__.py` | migration | 2026-11-26 | 03dfab1 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/models/__init__.py` | model | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/models/asset.py` | model | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/models/asset_warranty_claim.py` | model | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/models/assistant_conversation.py` | model | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/models/assistant_message.py` | model | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/models/reminder.py` | model | 2026-11-27 | working-tree (UU) | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/models/subscription.py` | model | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/models/subscription_payment.py` | model | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/models/vault_item.py` | model | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/module.py` | module | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/permissions/asset_permission.py` | permission | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/permissions/asset_warranty_claim_permission.py` | permission | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/permissions/assistant_config_permission.py` | permission | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/permissions/assistant_permission.py` | permission | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/permissions/reminder_permission.py` | permission | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/permissions/subscription_payment_permission.py` | permission | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/permissions/subscription_permission.py` | permission | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/permissions/vault_item_permission.py` | permission | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/permissions/workspace_calendar_permission.py` | permission | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/permissions/workspace_dashboard_permission.py` | permission | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/repositories/asset_repository.py` | repository | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/repositories/asset_warranty_claim_repository.py` | repository | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/repositories/assistant_conversation_repository.py` | repository | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/repositories/assistant_message_repository.py` | repository | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/repositories/reminder_repository.py` | repository | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/repositories/subscription_payment_repository.py` | repository | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/repositories/subscription_repository.py` | repository | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/repositories/vault_item_repository.py` | repository | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/serializers/__init__.py` | serializer | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/serializers/responses/__init__.py` | serializer | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/serializers/responses/asset_response_serializer.py` | serializer | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/serializers/responses/asset_warranty_claim_response_serializer.py` | serializer | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/serializers/responses/assistant_bot_profile_response_serializer.py` | serializer | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/serializers/responses/assistant_chat_response_serializer.py` | serializer | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/serializers/responses/assistant_command_response_serializer.py` | serializer | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/serializers/responses/assistant_config_response_serializer.py` | serializer | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/serializers/responses/assistant_message_response_serializer.py` | serializer | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/serializers/responses/assistant_thread_clear_response_serializer.py` | serializer | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/serializers/responses/assistant_thread_response_serializer.py` | serializer | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/serializers/responses/reminder_response_serializer.py` | serializer | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/serializers/responses/subscription_payment_response_serializer.py` | serializer | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/serializers/responses/subscription_response_serializer.py` | serializer | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/serializers/responses/telegram_async_process_response_serializer.py` | serializer | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/serializers/responses/vault_item_response_serializer.py` | serializer | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/serializers/responses/vault_item_reveal_response_serializer.py` | serializer | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/serializers/responses/workspace_calendar_event_response_serializer.py` | serializer | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/serializers/responses/workspace_calendar_response_serializer.py` | serializer | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/serializers/responses/workspace_cron_tick_response_serializer.py` | serializer | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/serializers/responses/workspace_dashboard_reminder_response_serializer.py` | serializer | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/serializers/responses/workspace_dashboard_summary_response_serializer.py` | serializer | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/serializers/validates/__init__.py` | serializer | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/serializers/validates/asset_create_validate_serializer.py` | serializer | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/serializers/validates/asset_update_validate_serializer.py` | serializer | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/serializers/validates/asset_warranty_claim_create_validate_serializer.py` | serializer | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/serializers/validates/asset_warranty_claim_update_validate_serializer.py` | serializer | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/serializers/validates/assistant_chat_validate_serializer.py` | serializer | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/serializers/validates/assistant_config_update_validate_serializer.py` | serializer | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/serializers/validates/assistant_thread_query_validate_serializer.py` | serializer | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/serializers/validates/reminder_bulk_update_validate_serializer.py` | serializer | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/serializers/validates/reminder_create_validate_serializer.py` | serializer | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/serializers/validates/reminder_update_validate_serializer.py` | serializer | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/serializers/validates/subscription_bulk_update_validate_serializer.py` | serializer | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/serializers/validates/subscription_create_validate_serializer.py` | serializer | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/serializers/validates/subscription_renew_validate_serializer.py` | serializer | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/serializers/validates/subscription_update_validate_serializer.py` | serializer | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/serializers/validates/vault_item_create_validate_serializer.py` | serializer | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/serializers/validates/vault_item_update_validate_serializer.py` | serializer | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/serializers/validates/workspace_calendar_query_validate_serializer.py` | serializer | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/services/asset_service.py` | service | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/services/asset_warranty_claim_service.py` | service | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/services/assistant_config_service.py` | service | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/services/assistant_conversation_service.py` | service | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/services/assistant_service.py` | service | 2026-11-27 | working-tree (MM) | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/services/assistant_slash_service.py` | service | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/services/assistant_tools_service.py` | service | 2026-11-27 | working-tree (UU) | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/services/reminder_service.py` | service | 2026-11-27 | working-tree (UU) | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/services/subscription_payment_service.py` | service | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/services/subscription_service.py` | service | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/services/telegram_assistant_reply_service.py` | service | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/services/telegram_assistant_router_service.py` | service | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/services/telegram_polling_service.py` | service | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/services/vault_item_service.py` | service | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/services/workspace_alerts_cache_service.py` | service | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/services/workspace_calendar_service.py` | service | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/services/workspace_cleanup_service.py` | service | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/services/workspace_cron_service.py` | service | 2026-11-27 | working-tree (UU) | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/services/workspace_dashboard_service.py` | service | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/services/workspace_exchange_service.py` | service | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/services/workspace_spending_service.py` | service | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/services/workspace_timezone_service.py` | service | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/services/xkiro_client.py` | service | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/tasks/purge_old_assistant_history.py` | task | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tasks/refresh_cron_schedules.py` | task | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/__init__.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/conftest.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_asset_bulk_delete_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_asset_create_api.py` | test | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/tests/test_asset_delete_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_asset_detail_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_asset_list_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_asset_update_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_assistant_bot_profile_api.py` | test | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/tests/test_assistant_chat_api.py` | test | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/tests/test_assistant_config_api.py` | test | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/tests/test_assistant_thread_api.py` | test | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/tests/test_cron_dispatch_due_api.py` | test | 2026-11-27 | working-tree (MM) | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/tests/test_cron_tick_api.py` | test | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_reminder_bulk_delete_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_reminder_bulk_update_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_reminder_create_api.py` | test | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/tests/test_reminder_delete_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_reminder_detail_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_reminder_list_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_reminder_update_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_subscription_bulk_delete_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_subscription_bulk_update_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_subscription_create_api.py` | test | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/tests/test_subscription_delete_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_subscription_detail_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_subscription_list_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_subscription_payment_bulk_delete_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_subscription_payment_delete_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_subscription_payment_list_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_subscription_renew_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_subscription_update_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_telegram_assistant_async_api.py` | test | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/tests/test_vault_bulk_delete_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_vault_create_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_vault_delete_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_vault_detail_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_vault_list_api.py` | test | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/tests/test_vault_reveal_api.py` | test | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/tests/test_vault_update_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_warranty_claim_bulk_delete_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_warranty_claim_create_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_warranty_claim_delete_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_warranty_claim_detail_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_warranty_claim_list_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_warranty_claim_update_api.py` | test | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/tests/test_workspace_calendar_api.py` | test | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/tests/test_workspace_dashboard_summary_api.py` | test | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/urls.py` | urls | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/app/workspace/utils/date_math.py` | be-module | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/views/__init__.py` | view | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/views/asset_view_set.py` | view | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/views/asset_warranty_claim_view_set.py` | view | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/views/assistant_bot_profile_view.py` | view | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/views/assistant_chat_view.py` | view | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/views/assistant_config_view.py` | view | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/views/assistant_thread_view.py` | view | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/views/reminder_view_set.py` | view | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/views/subscription_payment_view_set.py` | view | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/views/subscription_view_set.py` | view | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/views/telegram_assistant_process_view.py` | view | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/views/vault_item_view_set.py` | view | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/views/workspace_calendar_view.py` | view | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/views/workspace_cron_dispatch_due_view.py` | view | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/views/workspace_cron_tick_view.py` | view | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/workspace/views/workspace_dashboard_summary_view.py` | view | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |

### Backend · Config & Root (`backend/config`, env, pyproject) (16 file)

| File | Loại | Thay đổi gần nhất | Thay đổi bởi / Commit | Code | Security | i18n | Permission | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `backend/.env.example` | be-module | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/.python-version` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/.vercelignore` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/README.md` | be-module | 2026-11-22 | be17cfe | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/app/__init__.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/build_files.sh` | be-module | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/config/__init__.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/config/asgi.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/config/settings.py` | settings | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `backend/config/urls.py` | urls | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/config/wsgi.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/conftest.py` | be-module | 2026-11-26 | 507f42d | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/manage.py` | be-module | 2026-11-14 | fb23efa | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/pyproject.toml` | be-module | 2026-11-22 | ee7f12d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/requirements.txt` | be-module | 2026-11-22 | 1b3e870 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `backend/vercel.json` | be-module | 2026-11-20 | 3bfdedf | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |

### Frontend · Shares (`frontend/src/shares`) (213 file)

| File | Loại | Thay đổi gần nhất | Thay đổi bởi / Commit | Code | Security | i18n | Permission | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `frontend/src/shares/components/analytics/app-analytics.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/activity-change-row.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/components/common/activity-change-value.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/components/common/activity-timeline-item.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/components/common/activity-timeline.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/components/common/app-tooltip.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/components/common/checkbox-field.tsx` | component | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/chip-list-input.tsx` | component | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/components/common/choice-groups.tsx` | component | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/choice-list.tsx` | component | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/choice-list.types.ts` | component | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/code-input.tsx` | component | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/color-input.tsx` | component | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/confirm-dialog.tsx` | component | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/data-pagination.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/data-table.tsx` | component | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/data-table.types.ts` | component | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/date-picker.tsx` | component | 2026-11-27 | 51e32de | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/date-time-picker.tsx` | component | 2026-11-27 | 51e32de | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/edit-mode-button.tsx` | component | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/edit-mode-context.ts` | component | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/edit-mode-provider.tsx` | component | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/email-input.tsx` | component | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/empty-state.tsx` | component | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/filter-select.tsx` | component | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/form-actions.tsx` | component | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/form-back-button.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/components/common/form-control.styles.ts` | component | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/form-dialog.tsx` | component | 2026-11-27 | 51e32de | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/form-field.tsx` | component | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/form-id-context.ts` | component | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/form-layout.tsx` | component | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/form-page.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/components/common/form-section.tsx` | component | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/form-submit-button.tsx` | component | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/form.tsx` | component | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-chip-list-input.ts` | hook | 2026-11-27 | 51e32de | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-choice-groups.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-choice-list.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-column-resizing.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-data-pagination.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-data-table.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-date-picker.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-edit-mode-button.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-filter-select.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-form-dialog.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-form-extension.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-form-id.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-form-page-header.ts` | hook | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/components/common/hooks/use-message-scroller.ts` | hook | 2026-11-27 | 51e32de | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-multi-select.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-password-input.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-search-input.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-select-field.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-slug-input.ts` | hook | 2026-11-22 | 2d36c1c | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-sticky-columns.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-table-bulk-bar.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-tags-input.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-time-picker-popover.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-tiptap-basic-editor.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-tiptap-block-handle.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-tiptap-comment-editor.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-tiptap-editor.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-tiptap-image-node.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-tiptap-plugins.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-tiptap-slash-command.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-tiptap-toolbar.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/hooks/use-url-popover.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/image-upload.tsx` | component | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/image-upload.types.ts` | component | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/inline-help-tooltip.tsx` | component | 2026-11-27 | 51e32de | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/loading-state.tsx` | component | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/markdown-content.tsx` | component | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/components/common/message-avatar.tsx` | component | 2026-11-27 | 51e32de | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/message-content.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/components/common/message-meta.tsx` | component | 2026-11-27 | 51e32de | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/message-scroller.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/components/common/message.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/components/common/money-input.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/month-select.tsx` | component | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/multi-select.tsx` | component | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/number-input.tsx` | component | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/page-header.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/components/common/password-input.tsx` | component | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/radio-group-field.tsx` | component | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/record-detail-tabs.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/components/common/search-input.tsx` | component | 2026-11-27 | 51e32de | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/select-field.tsx` | component | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/slug-input.tsx` | component | 2026-11-22 | 2d36c1c | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/sortable-item.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/sortable-list.tsx` | component | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/status-badge.tsx` | component | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/switch-field.tsx` | component | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/table-bulk-bar.tsx` | component | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/table-column-resizer.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/components/common/table-header-cell.tsx` | component | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/table-row-actions.tsx` | component | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/table-status-switch.tsx` | component | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/table-toolbar.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/tags-input.tsx` | component | 2026-11-27 | 51e32de | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/time-picker-popover.tsx` | component | 2026-11-27 | 51e32de | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/time-picker.tsx` | component | 2026-11-27 | 51e32de | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/time-scroll-column.tsx` | component | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/timestamp-text.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/components/common/tiptap-basic-editor.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/tiptap-block-handle.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/components/common/tiptap-bubble-toolbar.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/tiptap-comment-editor.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/tiptap-content.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/components/common/tiptap-editor-extensions.ts` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/tiptap-editor.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/tiptap-editor.types.ts` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/tiptap-extensions.ts` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/tiptap-image-node-view.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/components/common/tiptap-notion-url-dialog.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/tiptap-slash-menu.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/common/tiptap-toggle.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/components/common/tiptap-toolbar.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/components/common/url-popover.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/components/common/user-avatar.tsx` | component | 2026-11-27 | working-tree (UU) | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/components/errors/error-state.tsx` | component | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/errors/forbidden-view.tsx` | component | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/errors/query-error-state.tsx` | component | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/layout/language-switcher.tsx` | component | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/layout/logo-mark.tsx` | component | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/layout/logo.tsx` | component | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/layout/theme-switcher.tsx` | component | 2026-11-16 | 53a2aee | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/providers/app-providers.tsx` | component | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/ui/accordion.tsx` | component | 2026-11-15 | 0fb19eb | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/ui/alert-dialog.tsx` | component | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/ui/alert.tsx` | component | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/ui/avatar.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/components/ui/badge.tsx` | component | 2026-11-15 | 0fb19eb | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/ui/breadcrumb.tsx` | component | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/ui/button.tsx` | component | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/ui/calendar.tsx` | component | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/ui/card.tsx` | component | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/ui/chart.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/ui/checkbox.tsx` | component | 2026-11-15 | 0fb19eb | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/ui/command.tsx` | component | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/ui/dialog.tsx` | component | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/ui/dropdown-menu.tsx` | component | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/ui/field.tsx` | component | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/ui/hover-card.tsx` | component | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/ui/input.tsx` | component | 2026-11-15 | 0fb19eb | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/ui/label.tsx` | component | 2026-11-27 | 51e32de | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/ui/popover.tsx` | component | 2026-11-15 | 0fb19eb | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/ui/radio-group.tsx` | component | 2026-11-15 | 0fb19eb | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/ui/select.tsx` | component | 2026-11-15 | 0fb19eb | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/ui/separator.tsx` | component | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/ui/sheet.tsx` | component | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/ui/sidebar.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/components/ui/skeleton.tsx` | component | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/ui/slider.tsx` | component | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/ui/sonner.tsx` | component | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/ui/switch.tsx` | component | 2026-11-15 | 0fb19eb | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/ui/table.tsx` | component | 2026-11-15 | 0fb19eb | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/ui/tabs.tsx` | component | 2026-11-25 | 35091cb | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/ui/textarea.tsx` | component | 2026-11-15 | 0fb19eb | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/components/ui/tooltip.tsx` | component | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/config/env.ts` | fe-module | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/constants/auth-error-codes.ts` | constant | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/constants/auth-session.ts` | constant | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/constants/currency.ts` | constant | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/constants/locale.ts` | constant | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/constants/pagination.ts` | constant | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/constants/permission-actions.ts` | constant | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/constants/query-config.ts` | constant | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/hooks/use-api-error-message.ts` | hook | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/hooks/use-bulk-actions.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/hooks/use-edit-mode.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/hooks/use-list-query.ts` | hook | 2026-11-15 | 3f472b6 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/hooks/use-media-query.ts` | hook | 2026-11-27 | 51e32de | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/hooks/use-message.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/hooks/use-mobile.ts` | hook | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/hooks/use-page-visibility.ts` | hook | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/hooks/use-resource-mutation.ts` | hook | 2026-11-19 | 79be1f9 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/hooks/use-stored-preference.ts` | hook | 2026-11-15 | 0fb19eb | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/hooks/use-tab-state.ts` | hook | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/hooks/use-table-state.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/lib/api/api-client.ts` | fe-module | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/lib/api/api-error.ts` | fe-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/lib/api/case-conversion.ts` | fe-module | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/lib/api/create-crud-service.ts` | fe-module | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/lib/api/csrf.ts` | fe-module | 2026-11-22 | 4ac3ac8 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/lib/api/resource-keys.ts` | fe-module | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/lib/api/session-paths.ts` | fe-module | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/lib/api/to-paginated.ts` | fe-module | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/lib/asset-paths.ts` | fe-module | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/lib/bulk-status.ts` | fe-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/lib/code-slug-input.ts` | fe-module | 2026-11-22 | 2d36c1c | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/lib/date-fns-locale.ts` | fe-module | 2026-11-15 | 0fb19eb | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/lib/date-time-format.ts` | fe-module | 2026-11-27 | fix | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/lib/date-time-input.ts` | fe-module | 2026-11-15 | 0fb19eb | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/lib/edit-mode.ts` | fe-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/lib/field-schemas.ts` | fe-module | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/lib/firebase-messaging.ts` | fe-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/lib/localized-route.ts` | fe-module | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/lib/markdown.ts` | fe-module | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/lib/number-format.ts` | fe-module | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/lib/permissions/resource-permissions.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/lib/presence.ts` | fe-module | 2026-11-15 | 0fb19eb | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/lib/query-client.ts` | fe-module | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/lib/safe-url.ts` | fe-module | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/lib/search-text.ts` | fe-module | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/lib/seo.ts` | fe-module | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/lib/user-display.ts` | fe-module | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/types/activity-timeline.types.ts` | types | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/types/api-schema.gen.ts` | generated-types | 2026-11-27 | working-tree (UU) | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `frontend/src/shares/types/api-schema.ts` | types | 2026-11-15 | 58e5782 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/types/api.types.ts` | types | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/shares/types/attachment.types.ts` | types | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/shares/types/navigation.types.ts` | types | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |

### Frontend · System (`frontend/src/modules/system`) (317 file)

| File | Loại | Thay đổi gần nhất | Thay đổi bởi / Commit | Code | Security | i18n | Permission | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `frontend/src/modules/system/components/announcement/announcement-form.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/announcement/announcement-table.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/announcement/hooks/use-announcement-form.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/announcement/hooks/use-announcement-table.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/attachment-folder/attachment-folder-filter.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/attachment-folder/attachment-folder-manager.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/attachment-folder/hooks/use-attachment-folder-manager.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/attachment/attachment-detail-content.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/attachment/attachment-detail-dialog.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/attachment/attachment-details.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/attachment/attachment-edit-dialog.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/attachment/attachment-edit-form.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/attachment/attachment-grid.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/attachment/attachment-image-editor-lazy.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/attachment/attachment-image-editor.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/attachment/attachment-image-upload.tsx` | component | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/attachment/attachment-library.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/attachment/attachment-media-filters.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/attachment/attachment-move-dialog.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/attachment/attachment-picker.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/attachment/attachment-preview.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/attachment/attachment-upload.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/attachment/attachment-video-player.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/attachment/attachment-view-mode-toggle.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/attachment/attachment-visibility-toggle.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/attachment/file-access-gate.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/attachment/hooks/use-attachment-detail-dialog.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/attachment/hooks/use-attachment-details.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/attachment/hooks/use-attachment-edit-dialog.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/attachment/hooks/use-attachment-image-editor.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/attachment/hooks/use-attachment-image-upload.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/attachment/hooks/use-attachment-library.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/attachment/hooks/use-attachment-move-dialog.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/attachment/hooks/use-attachment-picker.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/attachment/hooks/use-attachment-preview.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/attachment/hooks/use-attachment-upload.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/attachment/hooks/use-attachment-video-player.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/attachment/hooks/use-attachment-view-mode.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/attachment/hooks/use-file-access.ts` | hook | 2026-11-22 | 4ac3ac8 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/attachment/hooks/use-library-image-insert.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/attachment/library-image-insert.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/auth-session/hooks/use-session-table.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/auth-session/session-table.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/auth/auth-shell.tsx` | component | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/auth/forgot-password-form.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/auth/hooks/use-forgot-password-form.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/auth/hooks/use-invitation-form.ts` | hook | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/auth/hooks/use-login-form.ts` | hook | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/auth/hooks/use-reset-password-form.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/auth/hooks/use-social-auth-callback.ts` | hook | 2026-11-27 | fc06142 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/auth/hooks/use-verify-email.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/auth/invitation-form.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/auth/login-form.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/auth/reset-password-form.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/auth/social-auth-callback.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/auth/verify-email-status.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/callback/callback-list.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/currency/currency-form.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/currency/currency-profile.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/currency/currency-table.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/currency/hooks/use-currency-form.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/currency/hooks/use-currency-table.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/current-user/account-email.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/current-user/hooks/use-profile-dialog.ts` | hook | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/current-user/hooks/use-user-menu.ts` | hook | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/current-user/profile-dialog.tsx` | component | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/current-user/user-menu.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/exchange-rate/exchange-rate-form.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/exchange-rate/exchange-rate-table.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/exchange-rate/hooks/use-exchange-rate-form.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/exchange-rate/hooks/use-exchange-rate-table.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/journal-entry/hooks/use-journal-entry-detail.ts` | hook | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/journal-entry/hooks/use-journal-table.ts` | hook | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/journal-entry/hooks/use-record-history-items.ts` | hook | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/journal-entry/journal-entry-detail.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/journal-entry/journal-table.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/journal-entry/journal-value.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/journal-entry/record-history.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/notification-delivery/hooks/use-notification-delivery-table.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/notification-delivery/notification-delivery-table.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/notification-preference/hooks/use-notification-preference-matrix.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/notification-preference/notification-preference-matrix.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/notification-preference/notification-settings-tab.tsx` | component | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/notification/hooks/use-notification-bell.ts` | hook | 2026-11-27 | fc06142 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/notification/hooks/use-notification-realtime.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/notification/notification-bell.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/notification/notification-item.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/permission/hooks/use-permission-catalog.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/permission/permission-catalog.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/permission/permission-gate.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/push-device/hooks/use-push-registration.ts` | hook | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/push-device/push-device-card.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/role/hooks/use-role-create-form.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/role/hooks/use-role-form.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/role/hooks/use-role-profile.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/role/hooks/use-role-table.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/role/role-create-form.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/role/role-form.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/role/role-profile.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/role/role-table.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/setting/hooks/use-setting-table.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/setting/setting-edit-dialog.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/setting/setting-edit-form.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/setting/setting-social-auth-card.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/setting/setting-table.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/telegram-bot/hooks/use-telegram-bot-card.ts` | hook | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/telegram-bot/telegram-bot-card.tsx` | component | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/telegram-chat/hooks/use-telegram-chat-list.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/telegram-chat/telegram-chat-list.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/user-role/hooks/use-user-role-filter.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/user-role/hooks/use-user-role-picker.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/user-role/user-role-filter.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/user-role/user-role-picker.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/user/hooks/use-user-form.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/user/hooks/use-user-profile.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/user/hooks/use-user-table.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/user/user-activity-section.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/user/user-form.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/user/user-profile.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/user/user-social-account-card.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/user/user-social-accounts-section.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/components/user/user-table.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/components/webhook/webhook-list.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/constants/api-endpoints.ts` | constant | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/constants/auth-storage.ts` | constant | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/constants/error-codes.ts` | constant | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/constants/image-editor.ts` | constant | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/constants/journal-field-prefixes.ts` | constant | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/constants/journal-value-prefixes.ts` | constant | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/constants/media-player.ts` | constant | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/constants/media-types.ts` | constant | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/constants/notification-polling.ts` | constant | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/constants/profile-forms.ts` | constant | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/constants/query-keys.ts` | constant | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/constants/routes.ts` | constant | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-account-mutations.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-account-queries.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-admin-session-users.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-admin-sessions.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-announcements.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-attachment-folders.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-attachments.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-bulk-delete-users.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-bulk-set-users-active.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-callbacks.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-check-telegram-bot.ts` | hook | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-create-announcement.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-create-attachment-folder.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-create-user.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-currencies.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-currency-options.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-currency.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-current-user.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-delete-announcement.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-delete-attachment-folder.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-delete-attachments.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-delete-currency.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-delete-exchange-rate.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-delete-journal-entry.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-delete-notification-delivery.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-delete-setting.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-delete-telegram-chat.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-delete-user.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-exchange-rate-resolve.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-exchange-rates.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-fetch-exchange-rate.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-hide-notification.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-iam-mutations.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-iam-queries.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-journal-entries.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-journal-entry.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-journal-format.ts` | hook | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/hooks/use-journal-resources.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-journal.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-login.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-logout.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-mark-all-notifications-read.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-mark-notification-read.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-move-attachments.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-notification-deliveries.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-notification-preferences.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-notifications.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-permission-choice-groups.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-permission.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-public-settings.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-push-devices.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-record-history.ts` | hook | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/hooks/use-register-telegram-chat.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-retry-notification-delivery.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-role-options.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-save-currency.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-save-exchange-rate.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-save-notification-preferences.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-set-attachment-visibility.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-settings.ts` | hook | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-social-auth-exchange.ts` | hook | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-telegram-bot.ts` | hook | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-telegram-chat-action.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-telegram-chats.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-unread-count.ts` | hook | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-update-attachment-folder.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-update-attachment.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-update-profile.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-update-setting.ts` | hook | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-update-user.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-upload-attachment.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-user.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-users.ts` | hook | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/hooks/use-webhooks.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/lib/crop-image-canvas.ts` | fe-module | 2026-11-22 | 4ac3ac8 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/lib/notification-link.ts` | fe-module | 2026-11-27 | fc06142 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/lib/unregister-push-device.ts` | fe-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/lib/watermark-shadow.ts` | fe-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/messages/en.json` | messages | 2026-11-27 | working-tree (M) | 2026-11-27 | N/A | 2026-11-27 | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `frontend/src/modules/system/messages/vi.json` | messages | 2026-11-27 | working-tree (M) | 2026-11-27 | N/A | 2026-11-27 | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `frontend/src/modules/system/navigation.ts` | constant | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/permissions/announcement-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/permissions/attachment-folder-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/permissions/attachment-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/permissions/callback-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/permissions/currency-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/permissions/exchange-rate-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/permissions/iam-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/permissions/journal-entry-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/permissions/notification-delivery-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/permissions/notification-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/permissions/notification-preference-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/permissions/push-device-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/permissions/session-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/permissions/setting-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/permissions/telegram-chat-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/permissions/user-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/permissions/webhook-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/schemas/announcement.schema.ts` | schema | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/schemas/currency.schema.ts` | schema | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/schemas/exchange-rate.schema.ts` | schema | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/schemas/forgot-password.schema.ts` | schema | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/schemas/invitation.schema.ts` | schema | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/schemas/login.schema.ts` | schema | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/schemas/profile.schema.ts` | schema | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/schemas/reset-password.schema.ts` | schema | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/schemas/role.schema.ts` | schema | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/schemas/user.schema.ts` | schema | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/services/admin-auth-session.service.ts` | service | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/services/announcement.service.ts` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/services/attachment-folder.service.ts` | service | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/services/attachment.service.ts` | service | 2026-11-22 | 4ac3ac8 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/services/auth.service.ts` | service | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/services/callback.service.ts` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/services/currency.service.ts` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/services/current-user.service.ts` | service | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/services/exchange-rate.service.ts` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/services/journal-entry.service.ts` | service | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/services/notification-delivery.service.ts` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/services/notification-preference.service.ts` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/services/notification.service.ts` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/services/permission.service.ts` | service | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/services/push-device.service.ts` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/services/role-permission.service.ts` | service | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/services/role.service.ts` | service | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/services/setting.service.ts` | service | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/services/telegram-bot.service.ts` | service | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/services/telegram-chat.service.ts` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/services/user-role.service.ts` | service | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/services/user.service.ts` | service | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/services/webhook.service.ts` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/types/account.types.ts` | types | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/types/admin-session.types.ts` | types | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/types/attachment-folder.types.ts` | types | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/types/attachment.types.ts` | types | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/types/auth.types.ts` | types | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/types/callback.types.ts` | types | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/types/currency.types.ts` | types | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/types/iam.types.ts` | types | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/types/image-editor.types.ts` | types | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/types/journal-entry.types.ts` | types | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/types/journal.types.ts` | types | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/types/notification.types.ts` | types | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/types/profile-tab.types.ts` | types | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/types/setting.types.ts` | types | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/types/user.types.ts` | types | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/types/webhook.types.ts` | types | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/utils/folder-path.ts` | fe-module | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/announcement/announcement-create-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/announcement/announcement-list-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/attachment/attachment-image-upload-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/attachment/attachment-library-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/attachment/attachment-tiptap-image-plugin.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/attachment/file-access-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/auth-session/session-list-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/auth/forgot-password-view.tsx` | view | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/auth/invitation-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/auth/login-view.tsx` | view | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/auth/reset-password-view.tsx` | view | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/auth/social-auth-callback-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/auth/verify-email-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/callback/callback-list-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/currency/currency-create-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/currency/currency-detail-view.tsx` | view | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/system/views/currency/currency-list-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/exchange-rate/exchange-rate-create-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/exchange-rate/exchange-rate-list-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/journal-entry/journal-entry-detail-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/journal-entry/journal-list-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/journal-entry/record-history-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/notification-delivery/notification-delivery-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/permission/permission-list-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/role/role-create-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/role/role-detail-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/role/role-list-view.tsx` | view | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/setting/system-settings-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/user-role/user-role-filter-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/user-role/user-role-picker-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/user/user-create-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/user/user-detail-view.tsx` | view | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/user/user-list-view.tsx` | view | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/system/views/webhook/webhook-list-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |

### Frontend · Utilities (`frontend/src/modules/utilities`) (162 file)

| File | Loại | Thay đổi gần nhất | Thay đổi bởi / Commit | Code | Security | i18n | Permission | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `frontend/src/modules/utilities/components/donation/donation-table.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/components/page-path/hooks/use-page-path-form.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/page-path/hooks/use-page-path-select.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/page-path/hooks/use-page-path-table.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/page-path/page-path-form.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/components/page-path/page-path-profile.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/components/page-path/page-path-select.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/components/page-path/page-path-table.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/page/affiliate-page-renderer.tsx` | component | 2026-11-26 | 33c1a39 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/page/bio-link-icon.tsx` | component | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/page/bio-page-renderer.tsx` | component | 2026-11-26 | 33c1a39 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/page/donation-amount-icon-picker.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/components/page/donation-amount-icon.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/page/donation-page-renderer.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/components/page/donation-public-feed.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/components/page/hooks/use-affiliate-page-renderer.ts` | hook | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/page/hooks/use-donation-page-renderer.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/page/hooks/use-notion-demo.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/page/hooks/use-page-button-dialog.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/page/hooks/use-page-donation-qr-dialog.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/page/hooks/use-page-form.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/page/hooks/use-page-table.ts` | hook | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/page/hooks/use-preview-notice.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/page/hooks/use-quick-add-modal.ts` | hook | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/page/legacy-tiptap-page-renderer.tsx` | component | 2026-11-26 | 33c1a39 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/page/notion-demo-editor.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/components/page/notion-demo-showcase.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/components/page/page-affiliate-categories-editor.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/components/page/page-affiliate-import-dialog.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/components/page/page-affiliate-item-row.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/components/page/page-affiliate-items-editor.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/components/page/page-bio-editor.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/components/page/page-button-dialog.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/page/page-create-button.tsx` | component | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/page/page-create-dialog.tsx` | component | 2026-11-26 | 33c1a39 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/page/page-create-flow.tsx` | component | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/page/page-donation-amount-dialog.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/page/page-donation-editor.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/components/page/page-donation-qr-dialog.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/page/page-donation-qr-item-card.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/components/page/page-form.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/components/page/page-preview-frame.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/components/page/page-profile.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/components/page/page-renderer-dispatcher.tsx` | component | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/page/page-table.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/components/page/page-theme-editor.tsx` | component | 2026-11-26 | 33c1a39 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/page/preset-amount-icon.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/page/preview-notice.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/page/public-page.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/page/quick-add-modal.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/page/template-demo-showcase.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/components/qr-code/hooks/use-qr-code-form.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/qr-code/hooks/use-qr-code-insert.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/qr-code/hooks/use-qr-code-picker.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/qr-code/hooks/use-qr-code-table.ts` | hook | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/qr-code/qr-code-form.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/components/qr-code/qr-code-insert.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/qr-code/qr-code-picker.tsx` | component | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/qr-code/qr-code-profile.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/components/qr-code/qr-code-table.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/components/short-link/destination-favicon.tsx` | component | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/short-link/hooks/use-short-link-button-insert.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/short-link/hooks/use-short-link-form.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/short-link/hooks/use-short-link-landing.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/short-link/hooks/use-short-link-table.ts` | hook | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/short-link/short-link-button-insert.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/components/short-link/short-link-form.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/components/short-link/short-link-landing-card.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/components/short-link/short-link-profile.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/components/short-link/short-link-table.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/components/utilities-dashboard/utilities-dashboard.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/constants/api-endpoints.ts` | constant | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/constants/donation-icons.ts` | constant | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/constants/notion-demo-data.ts` | constant | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/constants/page-constants.ts` | constant | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/constants/page-theme-presets.ts` | constant | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/constants/polling.ts` | constant | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/constants/query-keys.ts` | constant | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/constants/routes.ts` | constant | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/extensions/page-extensions.ts` | fe-module | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-bulk-delete-pages.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-bulk-delete-qr-codes.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-bulk-delete-short-links.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-bulk-set-page-status.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-bulk-set-short-link-status.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-create-page-path.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-create-page.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-create-qr-code.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-create-short-link.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-delete-page-path.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-delete-page.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-delete-qr-code.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-delete-short-link.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-duplicate-page.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-page-path-options.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-page-path.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-page-paths.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-page.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-pages.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-public-page.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-public-short-link.ts` | hook | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-qr-banks.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-qr-code.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-qr-codes.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-qr-preview.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-resolved-page-theme.ts` | hook | 2026-11-25 | d662070 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-set-page-path-active.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-short-link-options.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-short-link.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-short-links.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-update-page-path.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-update-page.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-update-qr-code.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/hooks/use-update-short-link.ts` | hook | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/lib/donation-icon.ts` | fe-module | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/lib/page-theme.ts` | fe-module | 2026-11-26 | 33c1a39 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/messages/en.json` | messages | 2026-11-27 | fc7b309 | 2026-11-27 | N/A | 2026-11-27 | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `frontend/src/modules/utilities/messages/vi.json` | messages | 2026-11-27 | fc7b309 | 2026-11-27 | N/A | 2026-11-27 | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `frontend/src/modules/utilities/navigation.ts` | constant | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/permissions/donation-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/permissions/page-path-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/permissions/page-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/permissions/qr-code-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/permissions/short-link-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/schemas/page-path.schema.ts` | schema | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/schemas/page.schema.ts` | schema | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/schemas/qr-code.schema.ts` | schema | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/schemas/short-link.schema.ts` | schema | 2026-11-22 | 2d36c1c | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/services/donation.service.ts` | service | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/services/page-path.service.ts` | service | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/services/page.service.ts` | service | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/services/qr-code.service.ts` | service | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/services/short-link.service.ts` | service | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/types/custom-pages.types.ts` | types | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/types/donation.types.ts` | types | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/types/page-path.types.ts` | types | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/types/page.types.ts` | types | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/types/qr-code.types.ts` | types | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/types/qr-codes.types.ts` | types | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/types/short-link.types.ts` | types | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/utilities/types/short-links.types.ts` | types | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/views/donation/donation-list-view.tsx` | view | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/views/page-path/page-path-create-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/views/page-path/page-path-detail-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/views/page-path/page-path-list-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/views/page/notion-demo-view.tsx` | view | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/views/page/page-create-view.tsx` | view | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/views/page/page-detail-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/views/page/page-list-view.tsx` | view | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/views/page/public-page-view.tsx` | view | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/views/page/template-demo-view.tsx` | view | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/views/qr-code/qr-code-create-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/views/qr-code/qr-code-detail-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/views/qr-code/qr-code-list-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/views/qr-code/qr-code-tiptap-plugin.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/views/short-link/link-unavailable-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/views/short-link/short-link-create-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/views/short-link/short-link-detail-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/views/short-link/short-link-landing-view.tsx` | view | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/views/short-link/short-link-list-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/views/short-link/short-link-tiptap-plugin.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/utilities/views/utilities-dashboard/utilities-dashboard-view.tsx` | view | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |

### Frontend · Novel (`frontend/src/modules/novel`) (144 file)

| File | Loại | Thay đổi gần nhất | Thay đổi bởi / Commit | Code | Security | i18n | Permission | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `frontend/src/modules/novel/components/author/author-form.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/novel/components/author/author-profile.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/novel/components/author/author-table.tsx` | component | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/author/hooks/use-author-form.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/author/hooks/use-author-profile.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/author/hooks/use-author-table.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/chapter/chapter-form.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/novel/components/chapter/chapter-list.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/chapter/chapter-profile.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/novel/components/chapter/chapter-table.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/chapter/hooks/use-chapter-form.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/chapter/hooks/use-chapter-list.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/chapter/hooks/use-chapter-profile.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/chapter/hooks/use-chapter-table.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/favorite/hooks/use-novel-favorites-component.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/favorite/novel-favorites.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/novel/components/genre/genre-form.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/novel/components/genre/genre-profile.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/novel/components/genre/genre-table.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/genre/hooks/use-genre-form.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/genre/hooks/use-genre-profile.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/genre/hooks/use-genre-table.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/novel/hooks/use-novel-catalog.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/novel/hooks/use-novel-detail.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/novel/hooks/use-novel-form.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/novel/hooks/use-novel-guard.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/novel/hooks/use-novel-import-dialog.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/novel/hooks/use-novel-profile.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/novel/hooks/use-novel-table.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/novel/novel-card.tsx` | component | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/novel/novel-catalog.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/novel/novel-detail.tsx` | component | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/novel/novel-form.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/novel/components/novel/novel-guard.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/novel/novel-import-dialog.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/novel/novel-profile.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/novel/components/novel/novel-table.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/novel/components/reader/hooks/use-novel-reader.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/reader/hooks/use-reader-content.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/reader/novel-reader.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/reader/reader-content.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/reader/reader-footer.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/reader/reader-header.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/novel/components/reader/reader-settings-dialog.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/reading-history/hooks/use-reading-history.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/reading-history/reading-history.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/novel/components/tag/hooks/use-tag-form.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/tag/hooks/use-tag-profile.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/tag/hooks/use-tag-table.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/components/tag/tag-form.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/novel/components/tag/tag-profile.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/novel/components/tag/tag-table.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/constants/api-endpoints.ts` | constant | 2026-11-19 | 79be1f9 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/constants/query-keys.ts` | constant | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/constants/routes.ts` | constant | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-author-options.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-author.ts` | hook | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-authors.ts` | hook | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-bulk-delete-authors.ts` | hook | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-bulk-delete-genres.ts` | hook | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-bulk-delete-tags.ts` | hook | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-chapter.ts` | hook | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-chapters.ts` | hook | 2026-11-20 | 9949af5 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-clear-history.ts` | hook | 2026-11-19 | 79be1f9 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-client-chapter.ts` | hook | 2026-11-19 | 79be1f9 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-client-novel.ts` | hook | 2026-11-19 | 79be1f9 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-create-author.ts` | hook | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-create-chapter.ts` | hook | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-create-genre.ts` | hook | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-create-novel.ts` | hook | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-create-tag.ts` | hook | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-delete-author.ts` | hook | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-delete-chapter.ts` | hook | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-delete-genre.ts` | hook | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-delete-history-item.ts` | hook | 2026-11-19 | 79be1f9 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-delete-novel.ts` | hook | 2026-11-19 | 79be1f9 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-delete-tag.ts` | hook | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-favorite-novels.ts` | hook | 2026-11-19 | 79be1f9 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-genre-options.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-genre.ts` | hook | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-genres.ts` | hook | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-import-novel.ts` | hook | 2026-11-19 | 79be1f9 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-novel.ts` | hook | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-novels.ts` | hook | 2026-11-19 | 79be1f9 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-reader-settings.ts` | hook | 2026-11-19 | 79be1f9 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-reading-history.ts` | hook | 2026-11-19 | 79be1f9 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-tag-options.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-tag.ts` | hook | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-tags.ts` | hook | 2026-11-20 | 9949af5 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-toggle-favorite.ts` | hook | 2026-11-19 | 79be1f9 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-update-author.ts` | hook | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-update-chapter.ts` | hook | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-update-genre.ts` | hook | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-update-novel.ts` | hook | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/hooks/use-update-tag.ts` | hook | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/messages/en.json` | messages | 2026-11-25 | 37e3f80 | 2026-11-27 | N/A | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/messages/vi.json` | messages | 2026-11-25 | 37e3f80 | 2026-11-27 | N/A | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/navigation.ts` | constant | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/permissions/author-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/permissions/chapter-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/permissions/genre-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/permissions/novel-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/permissions/tag-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/schemas/author.schema.ts` | schema | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/schemas/chapter.schema.ts` | schema | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/schemas/genre.schema.ts` | schema | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/schemas/novel.schema.ts` | schema | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/schemas/tag.schema.ts` | schema | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/services/author.service.ts` | service | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/services/chapter.service.ts` | service | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/services/favorite.service.ts` | service | 2026-11-19 | 79be1f9 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/services/genre.service.ts` | service | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/services/novel.service.ts` | service | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/services/reading-history.service.ts` | service | 2026-11-19 | 79be1f9 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/services/tag.service.ts` | service | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/types/author.types.ts` | types | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/types/chapter.types.ts` | types | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/types/favorite.types.ts` | types | 2026-11-19 | 79be1f9 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/types/genre.types.ts` | types | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/types/novel-import.types.ts` | types | 2026-11-19 | 79be1f9 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/types/novel.types.ts` | types | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/types/reader-settings.types.ts` | types | 2026-11-19 | 79be1f9 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/types/reading-history.types.ts` | types | 2026-11-19 | 79be1f9 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/types/tag.types.ts` | types | 2026-11-19 | 5d3c92b | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/views/author/author-create-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/views/author/author-detail-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/views/author/author-list-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/views/chapter/chapter-create-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/views/chapter/chapter-detail-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/views/chapter/chapter-list-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/views/favorite/novel-favorites-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/views/genre/genre-create-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/views/genre/genre-detail-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/views/genre/genre-list-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/views/novel/admin-novel-list-view.tsx` | view | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/views/novel/novel-create-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/views/novel/novel-detail-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/views/novel/novel-edit-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/views/novel/novel-list-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/views/reader/novel-reader-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/views/reading-history/reading-history-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/views/tag/tag-create-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/views/tag/tag-detail-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/novel/views/tag/tag-list-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |

### Frontend · Finance (`frontend/src/modules/finance`) (133 file)

| File | Loại | Thay đổi gần nhất | Thay đổi bởi / Commit | Code | Security | i18n | Permission | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `frontend/src/modules/finance/components/classification-rule/hooks/use-rule-tester.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/classification-rule/rule-tester.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/dashboard/finance-count-chart.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/dashboard/finance-cumulative-chart.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/dashboard/finance-dashboard.tsx` | component | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/dashboard/finance-growth-chart.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/dashboard/finance-kpi-cards.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/dashboard/finance-platform-area-chart.tsx` | component | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/dashboard/finance-share-donut.tsx` | component | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/dashboard/finance-tax-chart.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/dashboard/finance-trend-chart.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/dashboard/hooks/use-finance-dashboard.ts` | hook | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/dashboard/year-select.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/finance-report/finance-report.tsx` | component | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/finance-report/hooks/use-finance-report.ts` | hook | 2026-11-25 | 102d505 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/income/hooks/use-income-form.ts` | hook | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/income/hooks/use-income-table.ts` | hook | 2026-11-25 | 102d505 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/income/income-create-button.tsx` | component | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/income/income-form.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/finance/components/income/income-profile.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/finance/components/income/income-table.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/finance/components/income/money-text.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/income/tax-status-badge.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/invoice/hooks/use-invoice-attachments-field.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/invoice/hooks/use-invoice-form.ts` | hook | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/invoice/hooks/use-invoice-table.ts` | hook | 2026-11-25 | 102d505 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/invoice/invoice-attachments-field.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/invoice/invoice-create-button.tsx` | component | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/invoice/invoice-form.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/finance/components/invoice/invoice-profile.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/finance/components/invoice/invoice-table.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/finance/components/platform/hooks/use-platform-form.ts` | hook | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/platform/hooks/use-platform-rules-dialog.ts` | hook | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/platform/hooks/use-platform-table.ts` | hook | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/platform/hooks/use-platform-tax-rates-section.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/platform/platform-create-button.tsx` | component | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/platform/platform-form.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/finance/components/platform/platform-profile.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/finance/components/platform/platform-rules-dialog.tsx` | component | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/platform/platform-table.tsx` | component | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/platform/platform-tax-rates-section.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/finance/components/sepay-connection/hooks/use-sepay-connection.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/sepay-connection/hooks/use-sepay-import.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/components/sepay-connection/sepay-connection.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/finance/components/sepay-connection/sepay-import.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/finance/constants/api-endpoints.ts` | constant | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/constants/chart-colors.ts` | constant | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/constants/finance-enums.ts` | constant | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/constants/query-keys.ts` | constant | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/constants/routes.ts` | constant | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-bulk-delete-incomes.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-bulk-delete-invoices.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-classification-rules.ts` | hook | 2026-11-25 | 102d505 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-delete-classification-rule.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-delete-income.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-delete-invoice.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-delete-platform.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-delete-sepay-connection.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-delete-tax-rate.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-finance-personal-scope.ts` | hook | 2026-11-25 | 102d505 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-finance-routes.ts` | hook | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-income-options.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-income.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-incomes.ts` | hook | 2026-11-25 | 102d505 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-invoice.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-invoices.ts` | hook | 2026-11-25 | 102d505 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-owner-filter-options.ts` | hook | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/finance/hooks/use-platform-options.ts` | hook | 2026-11-25 | 102d505 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-platform-tax-rate-resolve.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-platform-tax-rates.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-platform.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-platforms.ts` | hook | 2026-11-25 | 102d505 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-recalculate-income-tax.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-reclassify-incomes.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-refresh-income-rate.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-report-monthly.ts` | hook | 2026-11-25 | 102d505 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-report-summary.ts` | hook | 2026-11-25 | 102d505 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-rotate-sepay-secret.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-rule-test.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-save-classification-rule.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-save-income.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-save-invoice.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-save-platform.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-save-sepay-connection.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-save-tax-rate.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-seed-platforms.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-sepay-import.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-sepay-preview.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-sepay-status.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/hooks/use-test-sepay-connection.ts` | hook | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/lib/currency.ts` | fe-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/lib/report-series.ts` | fe-module | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/lib/tax.ts` | fe-module | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/messages/en.json` | messages | 2026-11-27 | fc7b309 | 2026-11-27 | N/A | 2026-11-27 | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `frontend/src/modules/finance/messages/vi.json` | messages | 2026-11-27 | fc7b309 | 2026-11-27 | N/A | 2026-11-27 | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `frontend/src/modules/finance/navigation.ts` | constant | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/permissions/income-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/permissions/invoice-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/permissions/platform-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/permissions/report-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/permissions/rule-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/permissions/sepay-permission.ts` | permission | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/schemas/classification-rule.schema.ts` | schema | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/schemas/income.schema.ts` | schema | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/schemas/invoice.schema.ts` | schema | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/schemas/platform.schema.ts` | schema | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/services/classification-rule.service.ts` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/services/finance-report.service.ts` | service | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/services/income.service.ts` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/services/invoice.service.ts` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/services/platform-tax-rate.service.ts` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/services/platform.service.ts` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/services/sepay-connection.service.ts` | service | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/types/classification-rule.types.ts` | types | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/types/finance-report.types.ts` | types | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/types/income.types.ts` | types | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/finance/types/invoice-attachment.types.ts` | types | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/types/invoice.types.ts` | types | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/finance/types/platform-tax-rate.types.ts` | types | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/types/platform.types.ts` | types | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/types/sepay.types.ts` | types | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/views/dashboard/finance-dashboard-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/views/finance-report/finance-report-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/views/income/income-create-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/views/income/income-detail-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/views/income/income-list-view.tsx` | view | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/views/invoice/invoice-create-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/views/invoice/invoice-detail-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/views/invoice/invoice-list-view.tsx` | view | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/views/platform/platform-create-view.tsx` | view | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/views/platform/platform-detail-view.tsx` | view | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/views/platform/platform-list-view.tsx` | view | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/finance/views/sepay-connection/sepay-view.tsx` | view | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |

### Frontend · Workspace (`frontend/src/modules/workspace`) (148 file)

| File | Loại | Thay đổi gần nhất | Thay đổi bởi / Commit | Code | Security | i18n | Permission | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `frontend/src/modules/workspace/components/asset-warranty-claim/hooks/use-warranty-claim-detail.ts` | hook | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/asset-warranty-claim/hooks/use-warranty-claim-form.ts` | hook | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/components/asset-warranty-claim/hooks/use-warranty-claim-table.ts` | hook | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/components/asset-warranty-claim/warranty-claim-detail.tsx` | component | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/asset-warranty-claim/warranty-claim-form.tsx` | component | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/asset-warranty-claim/warranty-claim-table.tsx` | component | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/asset/asset-claims-tab.tsx` | component | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/components/asset/asset-detail.tsx` | component | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/asset/asset-form.tsx` | component | 2026-11-27 | working-tree (UU) | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/asset/asset-invoices-field.tsx` | component | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/components/asset/asset-table.tsx` | component | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/asset/hooks/use-asset-detail.ts` | hook | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/asset/hooks/use-asset-form.ts` | hook | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/asset/hooks/use-asset-invoices-field.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/components/asset/hooks/use-asset-table.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/components/assistant/assistant-admin-panel.tsx` | component | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/assistant/assistant-avatar.tsx` | component | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/assistant/assistant-chat.tsx` | component | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/assistant/assistant-command-badge.tsx` | component | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/assistant/assistant-floating-widget.tsx` | component | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/assistant/assistant-slash-suggestions.tsx` | component | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/components/assistant/assistant-telegram-commands-card.tsx` | component | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/components/assistant/assistant-thinking-indicator.tsx` | component | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/components/assistant/hooks/use-assistant-admin-panel.ts` | hook | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/assistant/hooks/use-assistant-chat-panel.ts` | hook | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/assistant/hooks/use-assistant-floating-widget.ts` | hook | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/calendar/hooks/use-portal-calendar.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/components/calendar/portal-calendar.tsx` | component | 2026-11-27 | working-tree (MM) | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/dashboard/workspace-summary-cards.tsx` | component | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/components/reminder/hooks/use-reminder-detail.ts` | hook | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/reminder/hooks/use-reminder-form.ts` | hook | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/reminder/hooks/use-reminder-table.ts` | hook | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/components/reminder/reminder-detail.tsx` | component | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/reminder/reminder-form.tsx` | component | 2026-11-27 | working-tree (UU) | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/reminder/reminder-table.tsx` | component | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/subscription-payment/hooks/use-subscription-payment-table.ts` | hook | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/components/subscription-payment/subscription-payment-table.tsx` | component | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/subscription/hooks/use-subscription-detail.ts` | hook | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/subscription/hooks/use-subscription-form.ts` | hook | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/subscription/hooks/use-subscription-renew-dialog.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/components/subscription/hooks/use-subscription-table.ts` | hook | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/components/subscription/subscription-detail.tsx` | component | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/subscription/subscription-form.tsx` | component | 2026-11-27 | working-tree (UU) | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/subscription/subscription-payments-tab.tsx` | component | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/components/subscription/subscription-renew-dialog.tsx` | component | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/components/subscription/subscription-table.tsx` | component | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/vault-item/hooks/use-vault-item-detail.ts` | hook | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/vault-item/hooks/use-vault-item-form.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/components/vault-item/hooks/use-vault-item-table.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/components/vault-item/hooks/use-vault-reveal-dialog.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/components/vault-item/vault-item-detail.tsx` | component | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/vault-item/vault-item-form.tsx` | component | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/vault-item/vault-item-table.tsx` | component | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/components/vault-item/vault-reveal-dialog.tsx` | component | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/constants/api-endpoints.ts` | constant | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/constants/defaults.ts` | constant | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/constants/query-keys.ts` | constant | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/constants/routes.ts` | constant | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/hooks/use-asset-options.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-asset.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-assets.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-assistant-bot-profile.ts` | hook | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-assistant-chat.ts` | hook | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/hooks/use-assistant-config.ts` | hook | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-assistant-thread.ts` | hook | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-clear-assistant-thread.ts` | hook | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/hooks/use-delete-asset.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-delete-reminder.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-delete-subscription-payment.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-delete-subscription.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-delete-vault-item.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-delete-warranty-claim.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-reminder.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-reminders.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-renew-subscription.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-reveal-vault-item.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-save-asset.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-save-assistant-config.ts` | hook | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-save-reminder.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-save-subscription.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-save-vault-item.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-save-warranty-claim.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-subscription-options.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-subscription-payments.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-subscription.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-subscriptions.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-vault-item.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-vault-items.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-warranty-claim.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-warranty-claims.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-workspace-calendar.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-workspace-dashboard.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/hooks/use-workspace-owner-options.ts` | hook | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/messages/en.json` | messages | 2026-11-27 | working-tree (MM) | 2026-11-27 | N/A | PENDING (cũ: 2026-11-27) | N/A | NEEDS_CHECK | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `frontend/src/modules/workspace/messages/vi.json` | messages | 2026-11-27 | working-tree (MM) | 2026-11-27 | N/A | PENDING (cũ: 2026-11-27) | N/A | NEEDS_CHECK | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `frontend/src/modules/workspace/permissions/asset-permission.ts` | permission | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/permissions/asset-warranty-claim-permission.ts` | permission | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/permissions/assistant-config-permission.ts` | permission | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/permissions/assistant-permission.ts` | permission | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/permissions/reminder-permission.ts` | permission | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/permissions/subscription-payment-permission.ts` | permission | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/permissions/subscription-permission.ts` | permission | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/permissions/vault-item-permission.ts` | permission | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/permissions/workspace-calendar-permission.ts` | permission | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/permissions/workspace-dashboard-permission.ts` | permission | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/schemas/asset-warranty-claim.schema.ts` | schema | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/schemas/asset.schema.ts` | schema | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/schemas/assistant-config.schema.ts` | schema | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/schemas/reminder.schema.ts` | schema | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/schemas/subscription-renew.schema.ts` | schema | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/schemas/subscription.schema.ts` | schema | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/schemas/vault-item.schema.ts` | schema | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/services/asset-warranty-claim.service.ts` | service | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/services/asset.service.ts` | service | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/services/assistant-config.service.ts` | service | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/services/assistant.service.ts` | service | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/services/reminder.service.ts` | service | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/services/subscription-payment.service.ts` | service | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/services/subscription.service.ts` | service | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/services/vault-item.service.ts` | service | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/services/workspace-calendar.service.ts` | service | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/services/workspace-dashboard.service.ts` | service | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/types/asset-warranty-claim.types.ts` | types | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/types/asset.types.ts` | types | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/types/assistant.types.ts` | types | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/types/reminder.types.ts` | types | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/types/subscription-payment.types.ts` | types | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/types/subscription.types.ts` | types | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/types/vault-item.types.ts` | types | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/workspace/types/workspace-calendar.types.ts` | types | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/types/workspace-dashboard.types.ts` | types | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/views/asset-warranty-claim/warranty-claim-create-view.tsx` | view | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/views/asset-warranty-claim/warranty-claim-detail-view.tsx` | view | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/views/asset-warranty-claim/warranty-claim-list-view.tsx` | view | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/views/asset/asset-create-view.tsx` | view | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/views/asset/asset-detail-view.tsx` | view | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/views/asset/asset-list-view.tsx` | view | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/views/assistant/assistant-admin-view.tsx` | view | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/views/reminder/reminder-create-view.tsx` | view | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/views/reminder/reminder-detail-view.tsx` | view | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/views/reminder/reminder-list-view.tsx` | view | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/views/subscription-payment/subscription-payment-list-view.tsx` | view | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/views/subscription/subscription-create-view.tsx` | view | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/views/subscription/subscription-detail-view.tsx` | view | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/views/subscription/subscription-list-view.tsx` | view | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/views/vault-item/vault-item-create-view.tsx` | view | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/views/vault-item/vault-item-detail-view.tsx` | view | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/workspace/views/vault-item/vault-item-list-view.tsx` | view | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |

### Frontend · Portal (`frontend/src/modules/portal`) (42 file)

| File | Loại | Thay đổi gần nhất | Thay đổi bởi / Commit | Code | Security | i18n | Permission | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `frontend/src/modules/portal/components/dashboard/hooks/use-portal-dashboard.ts` | hook | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/portal/components/dashboard/portal-dashboard.tsx` | component | 2026-11-27 | working-tree (UU) | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/portal/components/dashboard/portal-donation-trend-chart.tsx` | component | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/portal/components/dashboard/portal-link-clicks-chart.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/portal/components/donation/portal-donation-dashboard.tsx` | component | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/portal/components/donation/portal-donation-gift-chart.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/portal/components/layout/hooks/use-portal-shell.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/portal/components/layout/hooks/use-portal-sidebar-section.ts` | hook | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/portal/components/layout/portal-bottom-nav.tsx` | component | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/portal/components/layout/portal-header.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/portal/components/layout/portal-shell.tsx` | component | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/portal/components/layout/portal-sidebar-section.tsx` | component | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/portal/components/layout/portal-sidebar.tsx` | component | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/portal/components/library/portal-library.tsx` | component | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/portal/components/page/portal-page-create.tsx` | component | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/portal/components/page/portal-page-edit.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/portal/components/profile/hooks/use-portal-profile.ts` | hook | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/portal/components/profile/portal-profile.tsx` | component | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/portal/components/qr-code/hooks/use-portal-qr-code-form.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/portal/components/qr-code/portal-qr-code-create.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/portal/components/qr-code/portal-qr-code-edit.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/portal/components/qr-code/portal-qr-code-form.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/portal/components/short-link/portal-short-link-create.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/portal/components/short-link/portal-short-link-edit.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/portal/constants/navigation.ts` | constant | 2026-11-27 | working-tree (MM) | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/portal/constants/query-keys.ts` | constant | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/portal/constants/routes.ts` | constant | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/portal/messages/en.json` | messages | 2026-11-27 | working-tree (M) | 2026-11-27 | N/A | 2026-11-27 | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `frontend/src/modules/portal/messages/vi.json` | messages | 2026-11-27 | working-tree (M) | 2026-11-27 | N/A | 2026-11-27 | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `frontend/src/modules/portal/views/dashboard/portal-dashboard-view.tsx` | view | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/portal/views/donation/portal-donation-view.tsx` | view | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/portal/views/library/portal-library-view.tsx` | view | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/portal/views/page/portal-page-create-view.tsx` | view | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/portal/views/page/portal-page-edit-view.tsx` | view | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/portal/views/page/portal-page-list-view.tsx` | view | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/portal/views/profile/portal-profile-view.tsx` | view | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/portal/views/qr-code/portal-qr-code-create-view.tsx` | view | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/portal/views/qr-code/portal-qr-code-edit-view.tsx` | view | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/portal/views/qr-code/portal-qr-code-list-view.tsx` | view | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/portal/views/short-link/portal-short-link-create-view.tsx` | view | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/portal/views/short-link/portal-short-link-edit-view.tsx` | view | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/portal/views/short-link/portal-short-link-list-view.tsx` | view | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |

### Frontend · Home (`frontend/src/modules/home`) (31 file)

| File | Loại | Thay đổi gần nhất | Thay đổi bởi / Commit | Code | Security | i18n | Permission | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `frontend/src/modules/home/components/errors/app-error-content.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/home/components/errors/global-error-content.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/home/components/errors/hooks/use-app-error-content.ts` | hook | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/home/components/errors/hooks/use-global-error-content.ts` | hook | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/home/components/errors/hooks/use-not-found-content.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/home/components/errors/not-found-content.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/home/components/landing/chill-audio.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/home/components/landing/clock-widget.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/home/components/landing/home-hero.tsx` | component | 2026-11-25 | 63e3273 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/home/components/landing/hooks/use-chill-audio.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/home/components/landing/hooks/use-clock.ts` | hook | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/home/components/landing/hooks/use-home-hero.ts` | hook | 2026-11-25 | 63e3273 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/home/components/landing/hooks/use-weather-canvas.ts` | hook | 2026-11-25 | 63e3273 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/home/components/landing/hooks/use-weather-widget.ts` | hook | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/home/components/landing/weather-canvas.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/home/components/landing/weather-icon.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/home/components/landing/weather-widget.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/home/components/layout/public-header.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/home/components/layout/public-layout.tsx` | component | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/home/constants/api-endpoints.ts` | constant | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/home/constants/routes.ts` | constant | 2026-11-15 | 0fb19eb | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/home/constants/weather-config.ts` | constant | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/home/hooks/use-report-client-error.ts` | hook | 2026-11-15 | 58e5782 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/home/lib/weather-detection.ts` | fe-module | 2026-11-25 | 63e3273 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/home/services/client-error.service.ts` | service | 2026-11-15 | 58e5782 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/home/store/weather-store.ts` | fe-module | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/home/types/clock.types.ts` | types | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/home/views/errors/app-error-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/home/views/errors/global-error-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/home/views/errors/not-found-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/home/views/landing/home-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |

### Frontend · Manage App (`frontend/src/modules/manage-app`) (31 file)

| File | Loại | Thay đổi gần nhất | Thay đổi bởi / Commit | Code | Security | i18n | Permission | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `frontend/src/modules/manage-app/components/launcher/hooks/use-module-launcher.ts` | hook | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/manage-app/components/launcher/launcher-footer.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/manage-app/components/launcher/launcher-header.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/manage-app/components/launcher/launcher-layout.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/manage-app/components/launcher/launcher-skeleton.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/manage-app/components/launcher/module-group-card-more-items.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/manage-app/components/launcher/module-group-card.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/manage-app/components/launcher/module-launcher.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/manage-app/components/shell/admin-attachment-picker-slot.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/manage-app/components/shell/admin-breadcrumb.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/manage-app/components/shell/admin-modules-context.ts` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/manage-app/components/shell/admin-modules-provider.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/manage-app/components/shell/admin-shell.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/manage-app/components/shell/header-actions.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/manage-app/components/shell/hooks/use-admin-groups.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/manage-app/components/shell/hooks/use-admin-shell.ts` | hook | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/manage-app/components/shell/hooks/use-group-breadcrumb.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/manage-app/components/shell/workspace-layout.tsx` | component | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/modules/manage-app/components/shell/workspace-skeleton.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/manage-app/components/sidebar/hooks/use-sidebar-module-group.ts` | hook | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/manage-app/components/sidebar/module-sidebar.tsx` | component | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/manage-app/components/sidebar/module-switcher.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/manage-app/components/sidebar/sidebar-module-group.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/manage-app/components/sidebar/sidebar-nav-section.tsx` | component | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/manage-app/constants/admin-navigation.ts` | constant | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/manage-app/constants/admin-shell.ts` | constant | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/manage-app/constants/launcher.ts` | constant | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/manage-app/constants/routes.ts` | constant | 2026-11-15 | 0fb19eb | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/manage-app/messages/en.json` | messages | 2026-11-24 | eb32524 | 2026-11-27 | N/A | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/manage-app/messages/vi.json` | messages | 2026-11-24 | eb32524 | 2026-11-27 | N/A | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/modules/manage-app/views/launcher/module-launcher-view.tsx` | view | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |

### Frontend · Core I18n, Proxy & Messages (`frontend/src/i18n`, `messages`, `proxy.ts`) (10 file)

| File | Loại | Thay đổi gần nhất | Thay đổi bởi / Commit | Code | Security | i18n | Permission | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `frontend/src/global.d.ts` | fe-module | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/i18n/messages.ts` | fe-module | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/i18n/navigation.ts` | constant | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/i18n/request-locale.ts` | fe-module | 2026-11-15 | 1985ce0 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/i18n/request.ts` | fe-module | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/i18n/routing.ts` | fe-module | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/messages/en.json` | messages | 2026-11-27 | fc7b309 | 2026-11-27 | N/A | 2026-11-27 | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `frontend/src/messages/vi.json` | messages | 2026-11-27 | fc7b309 | 2026-11-27 | N/A | 2026-11-27 | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `frontend/src/proxy.ts` | fe-module | 2026-11-27 | fc06142 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/store/auth-store.ts` | fe-module | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |

### Frontend · App Router (`frontend/src/app`) (139 file)

| File | Loại | Thay đổi gần nhất | Thay đổi bởi / Commit | Code | Security | i18n | Permission | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `frontend/src/app/[locale]/(admin)/admin/announcements/new/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/announcements/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/attachments/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/authors/[id]/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/authors/new/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/authors/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/callbacks/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/chapters/[id]/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/chapters/new/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/chapters/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/currencies/[id]/page.tsx` | route-page | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/app/[locale]/(admin)/admin/currencies/new/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/currencies/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/donations/page.tsx` | route-page | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/exchange-rates/new/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/exchange-rates/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/finance/incomes/[id]/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/finance/incomes/new/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/finance/incomes/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/finance/invoices/[id]/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/finance/invoices/new/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/finance/invoices/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/finance/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/finance/platforms/[id]/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/finance/platforms/new/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/finance/platforms/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/finance/reports/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/finance/sepay/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/genres/[id]/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/genres/new/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/genres/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/journal/[id]/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/journal/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/layout.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/notifications/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/novels/[id]/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/novels/new/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/novels/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/page-paths/[id]/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/page-paths/new/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/page-paths/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/pages/[id]/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/pages/new/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/pages/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/permissions/page.tsx` | permission | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/qr-codes/[id]/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/qr-codes/new/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/qr-codes/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/roles/[id]/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/roles/new/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/roles/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/sessions/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/settings/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/short-links/[id]/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/short-links/new/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/short-links/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/tags/[id]/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/tags/new/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/tags/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/users/[id]/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/users/new/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/users/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/utilities/page.tsx` | route-page | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/webhooks/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(admin)/admin/workspace/assistant/page.tsx` | route-page | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(auth)/auth/callback/[provider]/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(auth)/forgot-password/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(auth)/invitation/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(auth)/login/page.tsx` | route-page | 2026-11-27 | fc06142 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(auth)/reset-password/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(auth)/verify-email/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/assets/[id]/page.tsx` | route-page | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/assets/new/page.tsx` | route-page | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/assets/page.tsx` | route-page | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/donations/page.tsx` | route-page | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/files/page.tsx` | route-page | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/finance/incomes/[id]/page.tsx` | route-page | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/finance/incomes/new/page.tsx` | route-page | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/finance/incomes/page.tsx` | route-page | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/finance/invoices/[id]/page.tsx` | route-page | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/finance/invoices/new/page.tsx` | route-page | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/finance/invoices/page.tsx` | route-page | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/finance/page.tsx` | route-page | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/finance/platforms/[id]/page.tsx` | route-page | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/finance/platforms/new/page.tsx` | route-page | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/finance/platforms/page.tsx` | route-page | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/finance/reports/page.tsx` | route-page | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/finance/sepay/page.tsx` | route-page | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/layout.tsx` | route-page | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/library/page.tsx` | route-page | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/page.tsx` | route-page | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/pages/[id]/page.tsx` | route-page | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/app/[locale]/(client)/portal/pages/new/page.tsx` | route-page | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/pages/page.tsx` | route-page | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/profile/page.tsx` | route-page | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/qr-codes/[id]/page.tsx` | route-page | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/app/[locale]/(client)/portal/qr-codes/new/page.tsx` | route-page | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/qr-codes/page.tsx` | route-page | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/reminders/[id]/page.tsx` | route-page | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/reminders/new/page.tsx` | route-page | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/reminders/page.tsx` | route-page | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/short-links/[id]/page.tsx` | route-page | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/src/app/[locale]/(client)/portal/short-links/new/page.tsx` | route-page | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/short-links/page.tsx` | route-page | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/subscription-payments/page.tsx` | route-page | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/subscriptions/[id]/page.tsx` | route-page | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/subscriptions/new/page.tsx` | route-page | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/subscriptions/page.tsx` | route-page | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/vault/[id]/page.tsx` | route-page | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/vault/new/page.tsx` | route-page | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/vault/page.tsx` | route-page | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/warranty-claims/[id]/page.tsx` | route-page | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/warranty-claims/new/page.tsx` | route-page | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(client)/portal/warranty-claims/page.tsx` | route-page | 2026-11-26 | 03dfab1 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(public)/demo/[type]/page.tsx` | route-page | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(public)/demo/editor/page.tsx` | route-page | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(public)/demo/page.tsx` | route-page | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(public)/files/[id]/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(public)/layout.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(public)/link-unavailable/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(public)/novels/[slug]/[chapterNumber]/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(public)/novels/[slug]/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(public)/novels/favorites/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(public)/novels/history/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(public)/novels/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(public)/page-view/[segment]/[slug]/page.tsx` | route-page | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/(public)/page.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/[...rest]/page.tsx` | route-page | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/error.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/layout.tsx` | route-page | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/[locale]/not-found.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/global-error.tsx` | route-page | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/globals.css` | style | 2026-11-26 | 33c1a39 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/not-found.tsx` | route-page | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/robots.ts` | route-page | 2026-11-19 | 79be1f9 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/s/[slug]/page.tsx` | route-page | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/s/layout.tsx` | route-page | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/src/app/sitemap.ts` | route-page | 2026-11-14 | fb23efa | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |

### Frontend · Tests (`frontend/tests`) (88 file)

| File | Loại | Thay đổi gần nhất | Thay đổi bởi / Commit | Code | Security | i18n | Permission | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `frontend/tests/e2e/admin-pages.spec.ts` | test | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/tests/e2e/attachment-library.spec.ts` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/e2e/auth.spec.ts` | test | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/e2e/content-modules.spec.ts` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/e2e/data-table.spec.ts` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/e2e/filter-select.spec.ts` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/e2e/finance.spec.ts` | test | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/e2e/helpers.ts` | test | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/e2e/localization.spec.ts` | test | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/e2e/portal-workspace.spec.ts` | test | 2026-11-27 | working-tree (UU) | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/tests/e2e/protected-route.spec.ts` | test | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/e2e/qr-logo.spec.ts` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/e2e/responsive.spec.ts` | test | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/e2e/system-management.spec.ts` | test | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/activity-timeline.test.tsx` | test | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/tests/unit/admin-navigation.test.ts` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/api-client-cancel.test.ts` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/api-contract.test.ts` | test | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/tests/unit/asset-warranty-claim.test.tsx` | test | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/tests/unit/assistant-admin.test.tsx` | test | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/tests/unit/assistant-chat.test.tsx` | test | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/tests/unit/assistant-popup.test.tsx` | test | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/tests/unit/attachment-detail-dialog.test.tsx` | test | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/tests/unit/attachment-image-editor.test.tsx` | test | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/attachment-media.test.ts` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/attachment-video-player.test.tsx` | test | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/auth-service.test.ts` | test | 2026-11-21 | 4771ba5 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/auth-shell.test.tsx` | test | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/case-conversion.test.ts` | test | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/chart-colors.test.ts` | test | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/code-conventions.test.ts` | test | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/tests/unit/common-inputs.test.tsx` | test | 2026-11-27 | 51e32de | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/crop-image-canvas.test.ts` | test | 2026-11-22 | 4ac3ac8 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/data-pagination.test.ts` | test | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/date-time-format.test.tsx` | test | 2026-11-27 | fix | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/tests/unit/donation-keys.test.ts` | test | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/donation-public-feed.test.tsx` | test | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/donation-table.test.tsx` | test | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/error-boundary-security.test.tsx` | test | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/tests/unit/form-input-utils.test.ts` | test | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/form-page-header.test.tsx` | test | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/tests/unit/home-weather-logic.test.tsx` | test | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/tests/unit/iam-catalog-services.test.ts` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/login-form.test.tsx` | test | 2026-11-27 | fc06142 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/markdown-content.test.tsx` | test | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/tests/unit/messages.test.ts` | test | 2026-11-15 | 038bc05 | 2026-11-27 | 2026-11-27 | 2026-11-27 | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/module-group-card.test.tsx` | test | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/module-registry.test.ts` | test | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/module-structure.test.ts` | test | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/notification-link.test.ts` | test | 2026-11-27 | fc06142 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/one-unit-per-file.test.ts` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/page-form-tabs.test.tsx` | test | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/page-template.test.ts` | test | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/tests/unit/page-theme.test.ts` | test | 2026-11-26 | 33c1a39 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/platform-rules-dialog.test.tsx` | test | 2026-11-27 | 1a5bc08 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/portal-calendar.test.tsx` | test | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/tests/unit/portal-finance-scope.test.tsx` | test | 2026-11-25 | 102d505 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/portal-navigation.test.tsx` | test | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/tests/unit/portal-profile.test.tsx` | test | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/tests/unit/portal-shell.test.tsx` | test | 2026-11-27 | c53d1ab | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/profile-dialog.test.tsx` | test | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/tests/unit/public-header.test.tsx` | test | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/push-registration.test.tsx` | test | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/query-client.test.ts` | test | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/robots.test.ts` | test | 2026-11-19 | 79be1f9 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/search-input.test.tsx` | test | 2026-11-27 | 51e32de | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/security-controls.test.ts` | test | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/social-auth-callback-view.test.tsx` | test | 2026-11-27 | fc06142 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/sortable-list.test.ts` | test | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/table-column-widths.test.ts` | test | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/table-conventions.test.ts` | test | 2026-11-22 | 1b3e870 | 2026-11-27 | 2026-11-27 | N/A | 2026-11-27 | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/table-row-actions.test.tsx` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/table-url-state.test.ts` | test | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/tabs-focus.test.tsx` | test | 2026-11-25 | 35091cb | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/telegram-bot-card.test.tsx` | test | 2026-11-26 | 6d46e0f | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/theme-switcher.test.tsx` | test | 2026-11-16 | 53a2aee | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/theme-tokens.test.ts` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/tiptap-editor.test.tsx` | test | 2026-11-27 | 51e32de | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/unread-count.test.tsx` | test | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/use-tab-state.test.ts` | test | 2026-11-25 | 93e6312 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/use-user-menu.test.tsx` | test | 2026-11-25 | 37e3f80 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/user-avatar.test.tsx` | test | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/tests/unit/user-display.test.ts` | test | 2026-11-27 | working-tree (M) | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/tests/unit/user-menu.test.tsx` | test | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/tests/unit/user-social-accounts-section.test.tsx` | test | 2026-11-27 | fc7b309 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/tests/unit/vault-reveal.test.tsx` | test | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `frontend/tests/unit/watermark-shadow.test.ts` | test | 2026-11-22 | be17cfe | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tests/unit/workspace-notification-channels.test.tsx` | test | 2026-11-27 | 87f3761 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |

### Frontend · Config & Public (`frontend/*.ts`, `.env.example`, `public/`) (17 file)

| File | Loại | Thay đổi gần nhất | Thay đổi bởi / Commit | Code | Security | i18n | Permission | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `frontend/.env.example` | fe-config | 2026-11-22 | 4ac3ac8 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/.gitignore` | fe-config | 2026-11-17 | 8b3bb14 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/.prettierignore` | fe-config | 2026-11-27 | 644cb17 | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `frontend/.prettierrc.json` | fe-config | 2026-11-14 | fb23efa | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/AGENTS.md` | rule | 2026-11-14 | fb23efa | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/README.md` | fe-config | 2026-11-22 | 4ac3ac8 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/components.json` | fe-config | 2026-11-14 | fb23efa | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/eslint.config.mjs` | fe-config | 2026-11-15 | 58e5782 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/next.config.ts` | fe-config | 2026-11-26 | 296a57a | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/package.json` | fe-config | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/playwright.config.ts` | fe-config | 2026-11-26 | 507f42d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/pnpm-workspace.yaml` | fe-config | 2026-11-22 | a6a6347 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/public/icons/github.svg` | asset-svg | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/public/icons/google.svg` | asset-svg | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/public/notification-sw.js` | fe-module | 2026-11-22 | cd12f82 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/tsconfig.json` | fe-config | 2026-11-22 | a44d08a | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `frontend/vitest.config.mts` | fe-config | 2026-11-15 | 0fb19eb | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |

### Scripts & CI (`scripts/`, `.github/`) (10 file)

| File | Loại | Thay đổi gần nhất | Thay đổi bởi / Commit | Code | Security | i18n | Permission | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `.github/workflows/ci.yml` | workflow | 2026-11-20 | d2cb772 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `scripts/audit_tracker.py` | script | 2026-11-27 | 644cb17 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Tái xác nhận toàn bộ SEC-* (227 test BE + FE security-controls/error-boundary-security) và bổ sung SEC-HOOK-03 vào security-verification.md. |
| `scripts/build_brand_assets.py` | script | 2026-11-20 | 3bfdedf | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `scripts/check-all.ps1` | script | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `scripts/check-all.sh` | script | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `scripts/check-workflow-skills.py` | script | 2026-11-27 | 97e7d75 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `scripts/dev.bat` | script | 2026-11-26 | 507f42d | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `scripts/dev_runner.py` | script | 2026-11-26 | 507f42d | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `scripts/free-port.ps1` | script | 2026-11-26 | 507f42d | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `scripts/sync-ai-rules.py` | script | 2026-11-24 | eb32524 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |

### Rules, Skills & Prompts (`.agents/`, `AGENTS.md`, `CLAUDE.md`, `prompt.md`) (384 file)

| File | Loại | Thay đổi gần nhất | Thay đổi bởi / Commit | Code | Security | i18n | Permission | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `.agents/rules/00-core.md` | rule | 2026-11-26 | 507f42d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/rules/01-workflow.md` | rule | 2026-11-27 | 644cb17 | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `.agents/rules/10-backend.md` | rule | 2026-11-26 | 507f42d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/rules/11-tests.md` | rule | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/rules/20-frontend.md` | rule | 2026-11-26 | 507f42d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/rules/21-frontend-ui.md` | rule | 2026-11-27 | 644cb17 | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `.agents/rules/30-env-secrets.md` | rule | 2026-11-26 | 507f42d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/rules/40-docs-and-rules.md` | rule | 2026-11-26 | 507f42d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/rules/50-notifications.md` | rule | 2026-11-27 | working-tree (M) | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `.agents/rules/51-permissions.md` | rule | 2026-11-26 | 507f42d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/rules/52-free-tier-infra.md` | rule | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/rules/53-attachments.md` | rule | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/rules/54-security-review.md` | rule | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/rules/55-performance-review.md` | rule | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/rules/90-done-checklist.md` | rule | 2026-11-27 | 644cb17 | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `.agents/rules/91-rule-audit.md` | rule | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/commit-demo/SKILL.md` | skill | 2026-11-26 | 507f42d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/commit-push/SKILL.md` | skill | 2026-11-27 | 644cb17 | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `.agents/skills/commit-push/references/ci-matrix.md` | skill | 2026-11-27 | 97e7d75 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/create-plan/SKILL.md` | skill | 2026-11-27 | 644cb17 | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `.agents/skills/create-plan/references/plan-template.md` | skill | 2026-11-26 | e7fed52 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/create-plan/references/planning-checklist.md` | skill | 2026-11-26 | 507f42d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/db-migration/SKILL.md` | skill | 2026-11-27 | 644cb17 | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `.agents/skills/django-perf-review/LICENSE` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/django-perf-review/SKILL.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/fix/SKILL.md` | skill | 2026-11-27 | 644cb17 | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `.agents/skills/fix/references/regression-matrix.md` | skill | 2026-11-26 | 507f42d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/graphify/.graphify_version` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/graphify/SKILL.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/graphify/references/add-watch.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/graphify/references/exports.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/graphify/references/extraction-spec.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/graphify/references/github-and-merge.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/graphify/references/hooks.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/graphify/references/query.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/graphify/references/transcribe.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/graphify/references/update.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/i18n-audit/SKILL.md` | skill | 2026-11-27 | 644cb17 | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `.agents/skills/i18n-audit/scripts/scan_hardcoded_vi.py` | skill | 2026-11-25 | 77c4c61 | 2026-11-27 | 2026-11-27 | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/permission-audit/SKILL.md` | skill | 2026-11-27 | 644cb17 | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `.agents/skills/playwright-best-practices/SKILL.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/advanced/authentication-flows.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/advanced/authentication.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/advanced/clock-mocking.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/advanced/mobile-testing.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/advanced/multi-context.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/advanced/multi-user.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/advanced/network-advanced.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/advanced/third-party.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/architecture/pom-vs-fixtures.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/architecture/test-architecture.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/architecture/when-to-mock.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/browser-apis/browser-apis.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/browser-apis/iframes.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/browser-apis/service-workers.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/browser-apis/websockets.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/core/annotations.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/core/assertions-waiting.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/core/configuration.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/core/fixtures-hooks.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/core/global-setup.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/core/locators.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/core/page-object-model.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/core/projects-dependencies.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/core/test-data.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/core/test-suite-structure.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/core/test-tags.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/debugging/console-errors.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/debugging/debugging.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/debugging/error-testing.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/debugging/flaky-tests.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/frameworks/angular.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/frameworks/nextjs.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/frameworks/react.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/frameworks/vue.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/infrastructure-ci-cd/ci-cd.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/infrastructure-ci-cd/docker.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/infrastructure-ci-cd/github-actions.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/infrastructure-ci-cd/gitlab.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/infrastructure-ci-cd/other-providers.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/infrastructure-ci-cd/parallel-sharding.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/infrastructure-ci-cd/performance.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/infrastructure-ci-cd/reporting.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/infrastructure-ci-cd/test-coverage.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/testing-patterns/accessibility.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/testing-patterns/api-testing.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/testing-patterns/browser-extensions.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/testing-patterns/canvas-webgl.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/testing-patterns/component-testing.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/testing-patterns/drag-drop.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/testing-patterns/electron.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/testing-patterns/file-operations.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/testing-patterns/file-upload-download.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/testing-patterns/forms-validation.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/testing-patterns/graphql-testing.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/testing-patterns/i18n.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/testing-patterns/performance-testing.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/testing-patterns/security-testing.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-best-practices/testing-patterns/visual-regression.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-cli/SKILL.md` | skill | 2026-11-20 | d2cb772 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-cli/references/element-attributes.md` | skill | 2026-11-20 | d2cb772 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-cli/references/playwright-tests.md` | skill | 2026-11-20 | d2cb772 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-cli/references/pr-attachments.md` | skill | 2026-11-20 | d2cb772 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-cli/references/request-mocking.md` | skill | 2026-11-20 | d2cb772 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-cli/references/running-code.md` | skill | 2026-11-20 | d2cb772 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-cli/references/session-management.md` | skill | 2026-11-20 | d2cb772 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-cli/references/storage-state.md` | skill | 2026-11-20 | d2cb772 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-cli/references/test-generation.md` | skill | 2026-11-20 | d2cb772 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-cli/references/tracing.md` | skill | 2026-11-20 | d2cb772 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/playwright-cli/references/video-recording.md` | skill | 2026-11-20 | d2cb772 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/refactor/SKILL.md` | skill | 2026-11-27 | 644cb17 | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `.agents/skills/refactor/references/refactor-checklist.md` | skill | 2026-11-25 | 77c4c61 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/review-code/SKILL.md` | skill | 2026-11-27 | 644cb17 | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `.agents/skills/review-code/references/review-matrix.md` | skill | 2026-11-26 | 507f42d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/review-plan/SKILL.md` | skill | 2026-11-27 | 644cb17 | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `.agents/skills/review-plan/references/review-plan-matrix.md` | skill | 2026-11-26 | 507f42d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/review-security/SKILL.md` | skill | 2026-11-27 | 644cb17 | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `.agents/skills/review-security/references/attack-playbook.md` | skill | 2026-11-25 | 77c4c61 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/review-security/references/report-template.md` | skill | 2026-11-25 | 77c4c61 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/security-best-practices/LICENSE.txt` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/security-best-practices/SKILL.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/security-best-practices/agents/openai.yaml` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/security-best-practices/references/golang-general-backend-security.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/security-best-practices/references/javascript-express-web-server-security.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/security-best-practices/references/javascript-general-web-frontend-security.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/security-best-practices/references/javascript-jquery-web-frontend-security.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/security-best-practices/references/javascript-typescript-nextjs-web-server-security.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/security-best-practices/references/javascript-typescript-react-web-frontend-security.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/security-best-practices/references/javascript-typescript-vue-web-frontend-security.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/security-best-practices/references/python-django-web-server-security.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/security-best-practices/references/python-fastapi-web-server-security.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/security-best-practices/references/python-flask-web-server-security.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/sepay/SKILL.md` | skill | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/sepay/references/accounting.md` | skill | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/sepay/references/bankhub.md` | skill | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/sepay/references/banks.md` | skill | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/sepay/references/choose-integration.md` | skill | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/sepay/references/cli.md` | skill | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/sepay/references/debug-webhook.md` | skill | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/sepay/references/docs-lookup.md` | skill | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/sepay/references/einvoice.md` | skill | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/sepay/references/integration-design.md` | skill | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/sepay/references/invoice-reconciliation.md` | skill | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/sepay/references/mcp.md` | skill | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/sepay/references/oauth2.md` | skill | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/sepay/references/payment-gateway.md` | skill | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/sepay/references/payment-lookup.md` | skill | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/sepay/references/plain-language.md` | skill | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/sepay/references/plugins.md` | skill | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/sepay/references/refunds.md` | skill | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/sepay/references/revenue-report.md` | skill | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/sepay/references/revenue-rules.md` | skill | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/sepay/references/sepay-api.md` | skill | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/sepay/references/services.md` | skill | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/sepay/references/speaker-api.md` | skill | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/sepay/references/testing-go-live.md` | skill | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/sepay/references/vietqr.md` | skill | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/sepay/references/webhook.md` | skill | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/start-task/SKILL.md` | skill | 2026-11-27 | 644cb17 | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `.agents/skills/start-task/references/acceptance-matrix.md` | skill | 2026-11-26 | 507f42d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/test/SKILL.md` | skill | 2026-11-27 | 644cb17 | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `.agents/skills/test/references/monkey-testing.md` | skill | 2026-11-25 | 77c4c61 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/test/references/test-patterns.md` | skill | 2026-11-25 | 77c4c61 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/test/scripts/monkey-explore.mjs` | skill | 2026-11-25 | 77c4c61 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/SKILL.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/VERSION` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/brand-tokens.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/budgets.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/checklist.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/components/accordion.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/components/avatar.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/components/banner.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/components/breadcrumb.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/components/button.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/components/card.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/components/charts.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/components/chat.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/components/choice-controls.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/components/comment-thread.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/components/description-list.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/components/empty-state.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/components/file-upload.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/components/inline-edit.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/components/input.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/components/list-row.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/components/loading.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/components/logo.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/components/otp-input.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/components/quantity-input.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/components/range-slider.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/components/small-controls.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/components/sortable-header.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/components/tag-input.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/components/timeline.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/components/tree.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/design-process.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/flows.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/industry-patterns.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/app-kanban.html` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/app.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/app/activity.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/app/api-keys.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/app/billing.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/app/calendar.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/app/dashboard.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/app/data-table.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/app/entity-grid.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/app/error-pages.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/app/filtered-list.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/app/kanban.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/app/live-monitor.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/app/members.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/app/profile.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/app/record-detail.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/app/report.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/app/security.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/app/settings.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/app/shell-canvas.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/app/shell-floating.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/app/shell-full.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/app/shell-inset.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/app/shell-rail.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/app/shell-topnav.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/app/shell-unified.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/app/shell.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/app/two-panel.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/form.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/mobile-app.html` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/mobile-charts.html` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/mobile-immersive.html` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/mobile-order.html` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/mobile-photo.html` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/mobile-playful.html` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/mobile-showcase.html` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/mobile-tabbars.html` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/overlay.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/layouts/pricing.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/locked-rules.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/mobile.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/mobile/characters.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/mobile/charts.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/mobile/data-entry.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/mobile/faces.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/mobile/inputs.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/mobile/maps.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/mobile/motion.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/mobile/native-code.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/mobile/onboarding.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/mobile/ordering.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/mobile/showcase.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/mock-photos.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/principles.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/refactor.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/responsive.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/review.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/rules-color.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/rules-form.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/rules-state.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/rules-type.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/styles.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/system.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/tailwind-v4-traps.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/tokens.css` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/references/wireframe.md` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/scripts/audit.sh` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/scripts/check-update.mjs` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/scripts/lint-skill.mjs` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/scripts/measure-skill.mjs` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/ui-ux/scripts/probe.mjs` | skill | 2026-11-14 | 7513476 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/AGENTS.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/README.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/SKILL.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/_sections.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/_template.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/advanced-effect-event-deps.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/advanced-event-handler-refs.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/advanced-init-once.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/advanced-use-latest.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/async-api-routes.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/async-cheap-condition-before-await.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/async-defer-await.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/async-dependencies.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/async-parallel.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/async-suspense-boundaries.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/bundle-analyzable-paths.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/bundle-barrel-imports.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/bundle-conditional.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/bundle-defer-third-party.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/bundle-dynamic-imports.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/bundle-preload.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/client-event-listeners.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/client-localstorage-schema.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/client-passive-event-listeners.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/client-swr-dedup.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/js-batch-dom-css.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/js-cache-function-results.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/js-cache-property-access.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/js-cache-storage.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/js-combine-iterations.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/js-early-exit.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/js-flatmap-filter.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/js-hoist-regexp.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/js-index-maps.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/js-length-check-first.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/js-min-max-loop.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/js-request-idle-callback.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/js-set-map-lookups.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/js-tosorted-immutable.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/rendering-activity.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/rendering-animate-svg-wrapper.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/rendering-conditional-render.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/rendering-content-visibility.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/rendering-hoist-jsx.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/rendering-hydration-no-flicker.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/rendering-hydration-suppress-warning.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/rendering-resource-hints.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/rendering-script-defer-async.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/rendering-svg-precision.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/rendering-usetransition-loading.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/rerender-defer-reads.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/rerender-dependencies.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/rerender-derived-state-no-effect.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/rerender-derived-state.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/rerender-functional-setstate.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/rerender-lazy-state-init.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/rerender-memo-with-default-value.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/rerender-memo.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/rerender-move-effect-to-event.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/rerender-no-inline-components.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/rerender-simple-expression-in-memo.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/rerender-split-combined-hooks.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/rerender-transitions.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/rerender-use-deferred-value.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/rerender-use-ref-transient-values.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/server-after-nonblocking.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/server-auth-actions.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/server-cache-lru.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/server-cache-react.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/server-dedup-props.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/server-hoist-static-io.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/server-no-shared-module-state.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/server-parallel-fetching.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/server-parallel-nested-fetching.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vercel-react-best-practices/rules/server-serialization.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vitest/GENERATION.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vitest/SKILL.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vitest/references/advanced-environments.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vitest/references/advanced-projects.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vitest/references/advanced-type-testing.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vitest/references/advanced-vi.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vitest/references/core-cli.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vitest/references/core-config.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vitest/references/core-describe.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vitest/references/core-expect.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vitest/references/core-hooks.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vitest/references/core-test-api.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vitest/references/features-benchmarking.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vitest/references/features-concurrency.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vitest/references/features-context.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vitest/references/features-coverage.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vitest/references/features-filtering.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vitest/references/features-mocking.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vitest/references/features-reporters.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vitest/references/features-snapshots.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/vitest/references/features-test-tags.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/web-design-guidelines/SKILL.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/web-design-guidelines/references/command.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/web-perf/SKILL.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.agents/skills/web-perf/references/skill-feedback.md` | skill | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.gitattributes` | config | 2026-11-15 | 0fb19eb | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.githooks/commit-msg` | config | 2026-11-25 | 93e6312 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.githooks/pre-push` | config | 2026-11-14 | 8b62a3c | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.gitignore` | config | 2026-11-22 | be17cfe | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.graphifyignore` | config | 2026-11-16 | 53a2aee | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.vscode/extensions.json` | config | 2026-11-14 | fb23efa | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.vscode/settings.json` | config | 2026-11-19 | 79be1f9 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `.vscode/sftp.json` | config | 2026-11-22 | 1b3e870 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `AGENTS.md` | rule | 2026-11-27 | working-tree (M) | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `CLAUDE.md` | rule | 2026-11-27 | working-tree (M) | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `DESIGN.md` | config | 2026-11-21 | 4771ba5 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `README.md` | config | 2026-11-26 | 507f42d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `SYSTEM_CONTEXT.md` | rule | 2026-11-26 | 507f42d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `prompt.md` | rule | 2026-11-27 | working-tree (M) | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `skills-lock.json` | config | 2026-11-24 | eb32524 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |

### Tài liệu hệ thống (`docs/`) (62 file)

| File | Loại | Thay đổi gần nhất | Thay đổi bởi / Commit | Code | Security | i18n | Permission | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `docs/README.md` | doc | 2026-11-27 | working-tree (M) | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `docs/architecture/architecture.md` | doc | 2026-11-22 | be17cfe | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/architecture/authentication.md` | doc | 2026-11-27 | fc06142 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/architecture/authorization.md` | doc | 2026-11-22 | be17cfe | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/architecture/i18n.md` | doc | 2026-11-22 | be17cfe | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/architecture/infrastructure.md` | doc | 2026-11-27 | 644cb17 | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `docs/architecture/reference-audit.md` | doc | 2026-11-22 | be17cfe | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/architecture/testing.md` | doc | 2026-11-22 | be17cfe | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/audit/free-tier-optimization-handoff.md` | doc | 2026-11-26 | 296a57a | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/audit/infrastructure-free-tier-audit.md` | doc | 2026-11-26 | 296a57a | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/common-catalog.md` | doc | 2026-11-27 | working-tree (UU) | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `docs/features/admin-navigation.md` | doc | 2026-11-22 | 1b3e870 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/features/attachment-visibility.md` | doc | 2026-11-26 | 296a57a | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/features/permission-scope.md` | doc | 2026-11-26 | 507f42d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/features/permission-ui.md` | doc | 2026-11-27 | 644cb17 | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `docs/features/table-actions.md` | doc | 2026-11-27 | 644cb17 | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `docs/features/web-push.md` | doc | 2026-11-26 | 296a57a | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/guides/cloudflare-r2.md` | doc | 2026-11-22 | be17cfe | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/guides/deployment.md` | doc | 2026-11-27 | 644cb17 | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `docs/guides/finance-setup.md` | doc | 2026-11-26 | a427f8d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/guides/notification-setup.md` | doc | 2026-11-27 | working-tree (M) | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `docs/guides/oauth.md` | doc | 2026-11-22 | be17cfe | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/guides/telegram-webhook.md` | doc | 2026-11-27 | working-tree (??) | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `docs/modules/finance/README.md` | doc | 2026-11-27 | 1a5bc08 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/modules/home/README.md` | doc | 2026-11-26 | 296a57a | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/modules/manage-app/README.md` | doc | 2026-11-22 | be17cfe | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/modules/novel/README.md` | doc | 2026-11-22 | be17cfe | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/modules/system/README.md` | doc | 2026-11-27 | fc06142 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/modules/utilities/README.md` | doc | 2026-11-27 | 1a5bc08 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/modules/workspace/README.md` | doc | 2026-11-27 | working-tree (UU) | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `docs/note.md` | doc | 2026-11-26 | 24b33af | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/plans/2026/11/15/system-standardization-plan.md` | doc | 2026-11-26 | a427f8d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/plans/2026/11/21/finance-module-plan.md` | doc | 2026-11-26 | a427f8d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/plans/2026/11/21/finance-refactor-plan.md` | doc | 2026-11-26 | a427f8d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/plans/2026/11/22/2026-11-22-free-tier-optimization.md` | doc | 2026-11-26 | a427f8d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/plans/2026/11/22/2026-11-22-frontend-components-by-model.md` | doc | 2026-11-26 | a427f8d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/plans/2026/11/22/affiliate-page-specification.md` | doc | 2026-11-26 | a427f8d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/plans/2026/11/22/custom-page-audit.md` | doc | 2026-11-26 | a427f8d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/plans/2026/11/22/link-metadata-research.md` | doc | 2026-11-26 | a427f8d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/plans/2026/11/22/notification-system-plan.md` | doc | 2026-11-26 | a427f8d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/plans/2026/11/22/permission-ui-docs-plan.md` | doc | 2026-11-26 | a427f8d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/plans/2026/11/22/template-configuration-schema.md` | doc | 2026-11-26 | a427f8d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/plans/2026/11/22/template-data-model.md` | doc | 2026-11-26 | a427f8d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/plans/2026/11/22/template-implementation-plan.md` | doc | 2026-11-26 | a427f8d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/plans/2026/11/22/template-responsive.md` | doc | 2026-11-26 | a427f8d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/plans/2026/11/22/template-system-architecture.md` | doc | 2026-11-26 | a427f8d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/plans/2026/11/22/template-system-research.md` | doc | 2026-11-26 | a427f8d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/plans/2026/11/22/template-test-matrix.md` | doc | 2026-11-26 | a427f8d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/plans/2026/11/22/template-ui-ux.md` | doc | 2026-11-26 | a427f8d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/plans/2026/11/22/template-wireframe.html` | doc | 2026-11-26 | a427f8d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/plans/2026/11/25/personal-assistant-plan.md` | doc | 2026-11-27 | c53d1ab | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/reports/2026-11-22-background-jobs-plan.md` | doc | 2026-11-26 | a427f8d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/reports/2026-11-22-bulk-actions-sidebar-profile.md` | doc | 2026-11-22 | be17cfe | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/reports/2026-11-22-free-tier-optimization-result.md` | doc | 2026-11-26 | a427f8d | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/reports/2026-11-22-login-performance.md` | doc | 2026-11-22 | 1b3e870 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/reports/2026-11-22-rule-audit.md` | doc | 2026-11-22 | be17cfe | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/reports/foundation-report.html` | doc | 2026-11-22 | be17cfe | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |
| `docs/reports/security-verification.md` | doc | 2026-11-27 | working-tree (M) | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `docs/rules/backend.md` | doc | 2026-11-27 | working-tree (M) | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `docs/rules/common.md` | doc | 2026-11-27 | 644cb17 | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `docs/rules/frontend.md` | doc | 2026-11-27 | 644cb17 | 2026-11-27 | N/A | N/A | N/A | FIXED | Đạt 227 test BE, 520 test FE (one-unit-per-file, code-conventions, module-structure, messages, portal-calendar), sync-ai-rules & check-workflow-skills. |
| `docs/rules/git.md` | doc | 2026-11-27 | 97e7d75 | 2026-11-27 | N/A | N/A | N/A | PASS | Đã rà soát đủ 4 trục (2026-11-27) |

<!-- AUDIT_TABLES:END -->
