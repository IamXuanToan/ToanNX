---
trigger: model_decision
description: Dùng khi thêm hoặc sửa quyền, vai trò, phạm vi "của mình / của mọi người", ẩn/khóa menu, nút, trang theo quyền.
---

# Quyền và vai trò

Chi tiết: `docs/rules/backend.md` §9, `docs/features/permission-scope.md`, `docs/features/permission-ui.md`,
`docs/features/table-actions.md`, `docs/architecture/authorization.md`.

## Backend

- Quyền dạng `<module>.<resource>.<action>`; nguồn sự thật là bảng IAM (`system_role`, `system_permission`), không
  dùng Django groups/`PermissionsMixin`.
- Mỗi tài nguyên một class `XxxPermission(PermissionCatalog)` một file, khai `MEMBER = (READ, CREATE, ...)`.
  `module.py` gom `member_permissions=(*XxxPermission.member(), ...)`. Không chuỗi, không mẫu `*`. `MEMBER` không
  chứa `manage_all`/`read_private`.
- Vai trò dựng sẵn: `ADMIN` và `<MODULE>_MANAGER` / `_VIEWER` / `_MEMBER`; không tự đặt thêm role.
- "Chỉ bản ghi của mình" đến từ việc thiếu `manage_all` (`CoreCrudService.owner_field` + `manage_all_permission`);
  bản ghi người khác trả 404.
- Superuser bỏ qua kiểm quyền; `is_staff` chỉ mở khung quản trị FE, API không kiểm.

## Frontend

- Mỗi class quyền BE đúng một file `permissions/<resource>-permission.ts`.
- Ba tầng: menu ẩn mục thiếu `read`; View trả `ForbiddenView` khi thiếu quyền trang; trang chi tiết chỉ xem mặc định
  (`useEditMode` + `EditModeProvider`).
- Nút thiếu quyền **mờ + tooltip**, không ẩn (`can={{ update, delete }}`).

## Kiểm

Kiểm thử với tài khoản `_VIEWER`, `_MEMBER`, `_MANAGER`; `core/tests/test_endpoint_access.py` (ẩn danh 401, thiếu
quyền 403).
