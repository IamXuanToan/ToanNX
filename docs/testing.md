# Kiểm thử

## Backend — pytest + pytest-django (PostgreSQL)

```bash
cd backend
uv run pytest -q
```

- Settings: `config.settings` (đọc `backend/.env`). Database test: `test_toannx` do pytest-django tạo/hủy;
  không dùng SQLite. Fixture tự đổi hasher sang MD5 cho nhanh (test riêng xác nhận cấu hình thật là Argon2).
- `post_migrate` đồng bộ quyền/vai trò hệ thống vào DB test.

| File | Nội dung |
| --- | --- |
| `backend/conftest.py` | `client`, `csrf_client` (kiểm tra CSRF thật), `login` (đăng nhập qua API), `user/staff/superuser`, `staff_with(*perms)` |
| `app/core/tests/base/base_api_test_case.py` | `BaseApiTestCase`: `assert_success`, `assert_error`, `assert_paginated`, `assert_unauthorized`, `assert_forbidden`, `assert_no_sensitive_data` |
| `app/modules/iam/tests/factories/` | `user_factory.py`, `staff_factory.py`, `superuser_factory.py`, `role_factory.py` |
| `app/modules/iam/tests/helpers/permission_helper.py` | `grant(user, *permissions)` |
| `modules/attachment/tests/` | upload, nhận diện chữ ký file, giới hạn dung lượng, quyền, xóa mềm, ảnh đại diện |
| `modules/authentication/` | `test_login` (đúng/sai/inactive/validation/rate limit/không có register), `test_csrf`, `test_me` (JWT sai/hết hạn, khóa tài khoản), `test_refresh` (xoay vòng/expired/revoked/reuse/conflict, **refresh đồng thời 2 thread**), `test_logout`, `test_session` (list/revoke, đổi mật khẩu thu hồi phiên) |
| `modules/account/` | `test_user_api` (CRUD, `search`/filter/`ordering`/phân trang, chống leo thang, superuser cuối cùng), `test_account_auth_backend` (authenticate qua Django, `has_perm` qua IAM backend) |
| `modules/iam/` | `test_permission_checker`, `test_permission_rule` (any/all, `check`, `allow_if`), `test_admin_access`, `test_user_role_api` (gán/thu hồi, `GET` vai trò của người dùng), `test_role_api` (filter `auto_grant`) |
| `core/` | `test_user_context`, `test_responses` (request id, 404/405, readiness), `test_core_repository` (audit, 409, soft delete), `test_module_registry`, `test_settings`, `test_openapi_schema` (schema hợp lệ, không cảnh báo, đúng envelope/security), `test_module_conventions` (CoreModuleConfig, mã module = label, mọi view có kiểm tra module) |

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
- E2E (Playwright, `tests/e2e`): chạy trên server thật (backend 8000 + frontend 3000, DB dev). `global-setup.ts`
  tạo superuser `e2e-admin@toannx.local` bằng `createsuperuser` (đổi qua `E2E_EMAIL`/`E2E_PASSWORD`).
  - `auth.spec.ts`: đăng nhập, sai mật khẩu, validation theo ngôn ngữ, đăng xuất, **silent refresh** khi mất access token.
  - `protected-route.spec.ts`: redirect kèm `next` và quay lại, cookie gợi ý giả bị backend chặn, API 401.
  - `localization.spec.ts`: nội dung/`lang` theo locale, chuyển ngôn ngữ giữ route + query + phiên.
  - `responsive.spec.ts` (Pixel 7): không tràn ngang, sidebar dạng drawer.
  - `admin-pages.spec.ts`: màn chọn module + sidebar, chi tiết người dùng (Account + card vai trò IAM), tạo người dùng/vai trò là trang riêng.
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
E2E chạy riêng vì cần server và DB dev.
