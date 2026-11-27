---
name: permission-audit
description: "Kiểm toán và lập ma trận phân quyền BE-FE ba tầng cho repo ToanNX: đối chiếu XxxPermission/MEMBER, phạm vi owner và manage_all, menu ẩn theo read, ForbiddenView, useEditMode, cột Thao tác DataTable (can/bulk) và kiểm chứng thực tế bằng seed_test_accounts."
---

# Kiểm toán và lập ma trận phân quyền BE ↔ FE

Skill này chuyên kiểm tra toàn bộ hệ thống phân quyền theo mô hình IAM / 3 tầng UI đặc thù của ToanNX (Admin `/quan-tri` và Portal `/ca-nhan`), phát hiện lệch quyền từng model và kiểm chứng thực tế qua các vai trò mẫu.

## 1. Nạp quy chuẩn & lọc phạm vi bắt buộc

1. Chạy `uv run --no-project python scripts/audit_tracker.py list-pending --axis permission --format paths` để lấy danh sách file đang `NEEDS_CHECK` trên trục `permission` trong `docs/reports/code-audit-tracker.md`. Mặc định chỉ kiểm tra kỹ các file vừa đổi (cùng cặp quyền/view/service/menu/table BE ↔ FE liên quan), chỉ quét đủ toàn bộ các module khi người dùng yêu cầu kiểm toán toàn hệ thống.
2. Đọc `docs/architecture/authorization.md`, `docs/features/permission-scope.md`, `docs/features/permission-ui.md`, `docs/features/table-actions.md`, `docs/features/admin-navigation.md`, và `.agents/rules/51-permissions.md`.

## 2. Kiểm Backend theo phạm vi & từng module/model

Đối chiếu các module nằm trong phạm vi (hoặc lần lượt `system`, `utilities`, `novel`, `finance`, `workspace` khi rà toàn hệ thống):
1. **Catalog & `MEMBER`**:
   - Mỗi model một class `XxxPermission(PermissionCatalog)` riêng ở `permissions/<model>_permission.py`.
   - Khai rõ `MEMBER = (...)`; `MEMBER` **tuyệt đối không** chứa `manage_all` hoặc `read_private`.
   - `module.py` gom `member_permissions=(*XxxPermission.member(), ...)`.
2. **Service & Owner Scope**:
   - Tài nguyên có chủ sở hữu dùng `CoreCrudService` với `owner_field`, `manage_all_permission`.
   - Mọi method tùy chỉnh (export, duplicate, import, bulk, webhook setup, test action) phải tái kiểm quyền sở hữu hoặc `manage_all` ở lớp service, trả **404** cho bản ghi người khác khi thiếu `manage_all`.
   - API KHÔNG kiểm `is_staff`; quyền truy cập dữ liệu chỉ dựa vào IAM (`IsActiveAuthenticated` + `HasIamPermission`).
   - Bộ lọc `?owner=` / `?owners=` hoặc endpoint danh sách chọn user phụ phải bị khóa theo scope: thiếu `manage_all` chỉ thấy dữ liệu của chính mình.
3. **ViewSet & APIView**:
   - `CoreModelViewSet.action_permissions` khai tường minh mọi action (kể cả `bulk_update`, `bulk_delete`, `history`, `"create": DENY` cho ViewSet chỉ đọc mở `post` bulk).
   - `CoreApiView` gắn `@require_permission(...)` đúng cho từng HTTP method; view công khai/login-only phải liệt kê đúng trong `app/core/tests/test_endpoint_access.py`.

## 3. Kiểm Frontend ba tầng (Menu → View → Action/Detail)

1. **Đồng bộ tệp quyền FE ↔ BE**: Mỗi class quyền BE có đúng một file quyền FE `permissions/<model>-permission.ts` trùng mã `<module>.<resource>.<action>`.
2. **Tầng 1 — Menu & Điều hướng**:
   - Menu quản trị (`navigation.ts` + `use-admin-shell.ts`) và Portal (`portal-sidebar.tsx` + `portal-bottom-nav.tsx`): mỗi mục khai `permission` (`*.read`), thiếu quyền thì **ẩn mục**, hết mục thì ẩn cả module/nhóm.
   - `is_staff` chỉ dùng để hiện/ẩn khung `/quan-tri`, không thay thế quyền IAM. Portal `/ca-nhan` cho user đăng nhập (chuyển hướng thẳng sang `/dang-nhap` nếu chưa đăng nhập).
3. **Tầng 2 — Trang (`views/<model>/*-view.tsx`)**:
   - Mọi View đều kiểm `usePermission`: trả `<ForbiddenView />` khi thiếu quyền (`read` cho list/detail, `create` cho tạo mới).
4. **Tầng 3 — Thao tác bảng & Chi tiết**:
   - `DataTable`: luôn truyền đủ `onView` / `onEdit` / `onDelete`, thiếu quyền khai qua `can={{ update, delete, create }}` (nút mờ + tooltip lý do, không ẩn nút trừ ngoại lệ trong `docs/features/table-actions.md`), dòng bị khóa dùng `canEditRow`/`canDeleteRow`.
   - Có Xóa dòng → bắt buộc có chọn nhiều + `onBulkDelete`; có cờ boolean bật/tắt → có `bulkStatus` (`useBulkActions` + `createBooleanBulkStatus`).
   - Trang chi tiết: **mặc định chỉ xem** (`useEditMode(canUpdate)` + `<EditModeProvider canEdit={canUpdate}>`); có `read` mà thiếu `update` thì không bật chế độ sửa được.
   - Các `option hooks` phụ trợ (chọn platform, author, currency...) chỉ gọi API khi có quyền hoặc bật `enabled` đúng điều kiện để tránh bắn request 403 ngầm khi user chỉ mở màn khác!

## 4. Lập ma trận quyền & kiểm thử đa vai trò

1. Lập bảng **Ma trận quyền BE ↔ FE** (Module | Model | Quyền BE | Có trong `MEMBER`? | Owner field / `manage_all` | Menu FE | View FE | Detail/Edit | Table `can` & Bulk).
2. Kiểm trên dữ liệu/tài khoản thật bằng command:
   ```powershell
   uv run --project backend python backend/manage.py seed_test_accounts
   ```
   Tài khoản kiểm chuẩn gồm: `ADMIN`, `*_MANAGER`, `*_VIEWER` (có `read`, không `update`/`create`/`delete`), `*_MEMBER` (`is_staff=False`, chỉ xem/sửa bản của mình qua Portal).
3. Chạy `pytest --reuse-db` các endpoint bị chạm + `core/tests/test_endpoint_access.py`, và khi có UI thật dùng `playwright-cli` đăng nhập thử từng vai trò để chụp/kiểm trực tiếp menu, `ForbiddenView`, nút mờ + tooltip và `useEditMode`.
4. Sửa mọi độ lệch phát hiện được (đúng `docs/rules/`), cập nhật `docs/modules/<m>/README.md` nếu đổi `MEMBER`/quyền; đóng dấu các file vừa rà vào `docs/reports/code-audit-tracker.md` qua `uv run --no-project python scripts/audit_tracker.py mark-checked --axis permission --files <files...> --status <PASS|FIXED> --note "<tóm tắt phân quyền>"`. Nếu người dùng đặt ra rule mới chưa có trong `docs/rules/`, tự động cập nhật đồng bộ ngay vào `docs/rules/`, `.agents/rules/`, `AGENTS.md`, `CLAUDE.md`, `prompt.md` (kèm test quy ước nếu kiểm được) và chạy `python scripts/sync-ai-rules.py` (`--check`). Trả báo cáo đầy đủ (không tự thao tác Git hay tự gợi ý commit trừ khi người dùng yêu cầu).
