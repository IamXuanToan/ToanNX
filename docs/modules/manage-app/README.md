# Module Manage App (chỉ FE)

Khung quản trị dùng chung cho mọi module: màn chọn module, sidebar, breadcrumb, bảo vệ truy cập. Không có
module BE tương ứng.

- FE: `frontend/src/modules/manage-app/`
- URL: `/quan-tri` (màn chọn module); khung bọc mọi trang `/quan-tri/**`

## Thành phần

| Thành phần | Vai trò |
| --- | --- |
| `AdminShell` + `useAdminShell` | Tải người dùng, chặn khi không có quyền vào khung (`is_staff`), xử lý phiên hết hạn, lọc nhóm/module/mục theo quyền |
| `ModuleLauncher` | Màn chọn module: một thẻ mỗi nhóm (`ADMIN_GROUPS`) |
| `ModuleSidebar` → `SidebarModuleGroup` → `SidebarNavSection` | Sidebar: nhóm → module → cụm |
| `ModuleSwitcher` | Đổi nhóm ở đầu sidebar |
| `AdminBreadcrumb` | Breadcrumb theo mục đang mở |

## Khai báo

- `constants/admin-navigation.ts`: `ADMIN_GROUPS`, `ADMIN_MODULE_NAVIGATION` (đăng ký `navigation.ts` của từng
  module), `findModuleCodeByPath`, `findActiveNavHref`, `groupNavSections`.
- Module FE mới phải đăng ký vào `ADMIN_MODULE_NAVIGATION` (`tests/unit/module-registry.test.ts` kiểm).

## Chức năng liên quan

[Điều hướng quản trị](../../features/admin-navigation.md), [ẩn/khóa theo quyền](../../features/permission-ui.md).
