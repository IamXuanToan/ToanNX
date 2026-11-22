# Kiểm thử

## Backend — pytest + pytest-django (PostgreSQL)

```bash
cd backend
uv run pytest --reuse-db -q
```

- Settings: `config.settings` (đọc `backend/.env`).
- **Database test**: Bắt buộc dùng PostgreSQL local qua URL `postgresql://postgress:123456@localhost:5432/toannx?sslmode=prefer` (user `postgress`, pass `123456`). Tuyệt đối không trỏ tới cloud/server DB (Neon) khi chạy test để tránh mạng chậm và timeout.
- Database test `test_toannx` do pytest-django tạo/hủy trên PostgreSQL local; cờ `--reuse-db` tái sử dụng database test giúp chạy toàn bộ test trong ~4 phút; không dùng SQLite. Fixture tự đổi hasher sang MD5 cho nhanh (test riêng xác nhận cấu hình thật là Argon2).
- `post_migrate` đồng bộ quyền/vai trò hệ thống vào DB test.

| File | Nội dung |
| --- | --- |
| `backend/conftest.py` | `client`, `csrf_client` (kiểm tra CSRF thật), `login` (đăng nhập qua API), `user/staff/superuser`, `staff_with(*perms)` |
| `app/core/tests/base/base_api_test_case.py` | `BaseApiTestCase`: `assert_success`, `assert_error`, `assert_paginated`, `assert_unauthorized`, `assert_forbidden`, `assert_no_sensitive_data` |
| `app/system/tests/factories/` | `user_factory.py`, `staff_factory.py`, `superuser_factory.py`, `role_factory.py` |
| `app/system/tests/helpers/permission_helper.py` | `grant(user, *permissions)` |
| `app/novel/tests/` | Mỗi endpoint một file riêng (`test_<resource>_<action>_api.py`), bao phủ full/min data, validation, response, 401, 403, owner |
| `app/system/tests/` | Mỗi endpoint một file test riêng biệt; upload, nhận diện chữ ký file, dung lượng, quyền, xóa mềm, thư mục |
| `app/system/tests/` | Mỗi endpoint một file test riêng: `test_login`, `test_csrf`, `test_me`, `test_refresh`, `test_logout`, `test_password_reset_*`, `test_session_*`, `test_admin_session_*` |
| `app/system/tests/` | Mỗi endpoint một file test riêng (`test_user_*_api.py`), `test_account_auth_backend` |
| `app/system/tests/` | Mỗi endpoint một file test riêng (`test_role_*_api.py`, `test_user_role_*_api.py`), permission checker/rules |
| `core/` | `test_user_context`, `test_responses` (request id, 404/405, readiness), `test_core_repository` (audit, 409, soft delete), `test_module_registry`, `test_settings`, `test_openapi_schema` (schema hợp lệ, không cảnh báo, đúng envelope/security), `test_module_conventions` (CoreModuleConfig, mã module = label, mọi view có kiểm tra module) |

### Chuẩn kiểm thử API từng endpoint (1 endpoint = 1 file test)

- **Cấu trúc đặt tên**: `test_<resource>_<action>_api.py` (ví dụ `test_novel_list_api.py`, `test_novel_create_api.py`, `test_novel_update_api.py`...).
- **Không gộp theo model**: Không viết gom chung các action CRUD của model vào 1 file `test_<model>_api.py`.
- **Không tách file quyền riêng**: Quyền truy cập (401, 403) và quyền sở hữu (owner, manage_all) phải nằm trong chính file test của endpoint đó.
- **Tiêu chuẩn bao phủ bắt buộc trong mỗi file**:
  1. `full_data`: Gửi toàn bộ các trường (required + optional), kiểm tra DB và response.
  2. `min_data`: Gửi chỉ các trường bắt buộc tối thiểu, kiểm tra default/null của các trường còn lại.
  3. `validation_errors`: Kiểm tra các case validate lỗi (thiếu trường, sai định dạng, vượt ký tự, trùng lặp unique slug/code).
  4. `unauthenticated`: Chưa đăng nhập -> nhận 401 `AUTH_UNAUTHENTICATED`.
  5. `forbidden`: Đăng nhập nhưng thiếu quyền -> nhận 403 `PERMISSION_DENIED`.
  6. `owner_isolation`: Tài nguyên có owner: người dùng khác truy cập nhận 404/403, người có `manage_all` thao tác thành công.
  7. `response_envelope`: Response bọc chuẩn `{success, data, meta: {request_id}}`, status code chuẩn.
  8. `list_features` (với endpoint list): Lọc nhiều giá trị, tìm kiếm (`search`), sắp xếp (`ordering`), phân trang (`page`, `page_size`).

Base class CRUD (`base_create_api_test_case`...) theo kiểu PMS **không** được tạo: các endpoint hiện tại có quy
tắc riêng, test tường minh dễ đọc hơn. Có thể bổ sung khi có module CRUD lặp lại nhiều.

## Frontend

- Attachment: backend kiểm tra user không phải staff vẫn thao tác được khi có quyền, cách ly owner,
  `manage_all` không cấp quyền action, rollback xóa hàng loạt, bộ lọc nhiều giá trị và avatar đã xóa.
  `attachment-library.spec.ts` kiểm tra thư mục nhiều cấp trong dialog, upload vào thư mục con,
  lọc cả nhánh, hai lựa chọn xóa nhánh và dialog ở bảy bề rộng; kiểm tra upload, chọn hết/bỏ chọn, lưu avatar bằng ảnh có sẵn,
  xóa ảnh đang dùng, thư viện riêng của staff và responsive 375–1920px.

```bash
cd frontend
pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build
pnpm e2e        # Playwright
```

- Unit (Vitest, `tests/unit`): chuyển đổi case (gồm Date/Blob/FormData/opaque), `sanitizeNextPath` (open redirect),
  `hasPermission/canAccessAdmin`, kiểm tra message i18n.
  `search-input.test.tsx` kiểm tra Enter, IME, xóa và đồng bộ từ khóa; `table-url-state.test.ts` bảo toàn
  bộ lọc khi đổi state bảng; `iam-catalog-services.test.ts` kiểm tra danh mục nhiều trang và lỗi trang sau.
- E2E (Playwright, `tests/e2e`): chạy trên server thật với **database riêng** `toannx_e2e`: Playwright gọi
  `manage.py prepare_e2e` (tạo DB nếu chưa có, migrate, superuser `e2e-admin@toannx.local`, đổi qua
  `E2E_EMAIL`/`E2E_PASSWORD`), rồi chạy backend 8001 và frontend 3001 (bản build trong `.next-e2e`).
  `content-modules.spec.ts`: các trang nhóm Tiện ích, `/s/{slug}` mở trang trung gian và kiểm mật khẩu,
  Journal hiện field cũ → mới và
  trang chi tiết.
  - `auth.spec.ts`: đăng nhập, sai mật khẩu, validation theo ngôn ngữ, đăng xuất, **silent refresh** khi mất access token.
  - `protected-route.spec.ts`: redirect kèm `next` và quay lại, cookie gợi ý giả bị backend chặn, API 401.
  - `localization.spec.ts`: nội dung/`lang` theo locale, chuyển ngôn ngữ giữ route + query + phiên.
  - `responsive.spec.ts` (Pixel 7): không tràn ngang, sidebar dạng drawer.
  - `admin-pages.spec.ts`: màn chọn module + sidebar, chi tiết người dùng (thông tin tài khoản + card vai trò IAM), tạo người dùng/vai trò là trang riêng.
  - `data-table.spec.ts`: cột chọn/`#`/thao tác, sắp xếp ghi URL, khoá hàng loạt, mở bằng thao tác dòng, xoá có xác nhận,
    chọn cả trang + xoá hàng loạt vai trò, ẩn/hiện cột, số dòng mỗi trang.
  - `responsive.spec.ts` (Pixel 7) có thêm: bảng người dùng mỗi dòng một card, không tràn ngang.
  - `system-management.spec.ts`: tìm khi Enter, lọc người dùng theo vai trò/trạng thái, ba bộ lọc vai trò,
    quyền chỉ đọc nhóm theo module, xem/thu hồi phiên người khác và kiểm tra phiên đó không còn truy cập được.
  - Màn System và form tạo được kiểm tra không tràn ngang ở 375/768/1024/1280/1366/1440/1920px.

Backend có `authentication/tests/test_admin_session_api.py` kiểm tra quyền đọc/thu hồi riêng, bảo vệ phiên
superuser, bộ lọc, dữ liệu an toàn và thu hồi hiện tại; `account/tests/test_user_role_filter.py` kiểm tra
bộ lọc vai trò kết hợp tìm kiếm/trạng thái.

`scripts/check-all.{sh,ps1}` chạy cùng một quy trình: format → lint/type → test backend → lint/format → typecheck/unit → build frontend.
E2E chạy riêng vì cần server; CI (`.github/workflows/ci.yml`) chạy backend, frontend và kiểm kiểu OpenAPI.
