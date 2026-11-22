# Phân quyền (IAM / RBAC)

```
system.User ─< UserRole >─ Role ─< RolePermission >─ Permission (module.resource.action)
```

Tài khoản (`system.User`) và IAM (vai trò/quyền) cùng thuộc module **System**; phần tài khoản không gọi
service IAM, quyền đi qua authentication backend.

Nguồn sự thật duy nhất là các bảng IAM. Django `Group`/`Permission` (bảng của `django.contrib.auth`) vẫn tồn tại
do Django yêu cầu nhưng **không được dùng**. `AUTHENTICATION_BACKENDS` gồm hai backend tách trách nhiệm:

| Backend | Module | Việc |
| --- | --- | --- |
| `AccountAuthBackend` | system | `authenticate` (email + mật khẩu qua `UserService`), `get_user` |
| `IamPermissionBackend` | system | `has_perm`, `has_module_perms` qua `PermissionChecker` |

`User.has_perm()` hỏi lần lượt các backend (chuẩn Django), nên service tài khoản không import IAM mà mọi API kiểu
Django vẫn dùng cùng nguồn quyền.

## Đánh giá quyền (`app/system/services/permission_checker.py`)

1. Chưa đăng nhập → DENY.
2. `is_active=False` → DENY.
3. `is_superuser=True` → ALLOW (tầng ứng dụng; vẫn phải đăng nhập).
4. Lấy quyền `is_active` từ các vai trò `is_active`, chưa xóa mềm của user (một truy vấn, cache trên đối tượng
   user của request — không cache xuyên request).
5. Có mã quyền → ALLOW, ngược lại DENY.

API: `has_permission(user, code)`, `has_any_permission`, `has_all_permissions`, `get_permissions`, `invalidate`.

## Bảo vệ API

Mặc định toàn hệ thống (`DEFAULT_PERMISSION_CLASSES`) là `IsActiveAuthenticated` + `HasIamPermission`: phải đăng
nhập, tài khoản đang hoạt động và có quyền IAM khai cho method/action. View chỉ kế thừa `CoreApiView` hoặc
`CoreModelViewSet`; endpoint công khai/chỉ đăng nhập ghi đè `permission_classes` (bảng trong
[rule backend](../rules/backend.md) mục 3).

```python
# APIView: mỗi method khai báo quyền
class UserRoleView(CoreApiView):
    @require_permission(IamPermission.ROLE_ASSIGN)
    @validate_request(UserRoleAssignValidateSerializer)
    def post(self, request, user_id, validated_data): ...

# ViewSet: quyền theo action (gồm action có sẵn bulk_update, bulk_delete, history)
class UserViewSet(CoreModelViewSet[User]):
    action_permissions = {
        "list": permission_rule(IamPermission.USER_READ),
        "create": permission_rule(IamPermission.USER_CREATE),
        "update": DENY,                      # đóng tường minh action router sinh mà không hỗ trợ
    }
```

`PermissionRule` (`iam/types/permission_rule.py`), dùng chung cho `@require_permission` và `permission_rule`:

| Tham số | Ngữ nghĩa |
| --- | --- |
| `*permissions` | Mặc định cần **ít nhất một** quyền |
| `require_all=True` | Cần **tất cả** quyền |
| `check=fn(request, view) -> bool` | Điều kiện bổ sung (AND), áp dụng cả với superuser |
| `allow_if=fn(request, view) -> bool` | Điều kiện thay thế (OR), ví dụ chính chủ |

Method không gắn `@require_permission` hoặc action không có trong `action_permissions` bị từ chối (mặc định DENY).
`is_staff` **không** được kiểm ở API: người có quyền IAM gọi được API dù không phải staff.

Tài nguyên có owner (link rút gọn, mã QR, trang, file): service khai `owner_field` + `manage_all_permission`.
Người không có quyền `*.manage_all` chỉ thấy/sửa bản của mình; bản của người khác trả 404.

| Mã lỗi | Khi nào |
| --- | --- |
| 401 `AUTH_NOT_AUTHENTICATED` | Chưa đăng nhập |
| 403 `PERMISSION_DENIED` | Thiếu quyền (`details.permissions`: danh sách mã quyền yêu cầu) |
| 404 `NOT_FOUND` | Bản ghi không tồn tại, đã xóa mềm hoặc thuộc người khác |

## Cờ người dùng

| Cờ | Ý nghĩa |
| --- | --- |
| `is_superuser` | Toàn quyền tầng ứng dụng. Chỉ superuser được bật/tắt cờ này và sửa tài khoản superuser. |
| `is_staff` | Chỉ quyết định hiển thị khung quản trị ở FE; API không kiểm cờ này, từng chức năng cần quyền IAM. |
| `is_novel` | Đánh dấu nhóm nghiệp vụ Novel; không cấp quyền nào (quyền Novel sẽ do IAM khi có module Novel). |
| `is_active` | Khóa/mở tài khoản; khóa sẽ thu hồi mọi phiên. |

## Chống leo thang đặc quyền (`system/services/user_service.py`, `user_role_service.py`, `role_service.py`, `role_permission_service.py`)

- Người không phải superuser không được đổi `is_active/is_staff/is_superuser` của **chính mình** (`ACCOUNT_SELF_MODIFICATION`)
  hay vai trò của chính mình (`IAM_SELF_MODIFICATION`).
- Bật/tắt `is_superuser` cần là superuser (`ACCOUNT_PRIVILEGE_ESCALATION`); chỉ superuser sửa tài khoản superuser
  (`ACCOUNT_SUPERUSER_PROTECTED`).
- Chỉ gán được vai trò mà mọi quyền của nó bạn đều có; chỉ cấp được quyền bạn đang có (`IAM_PRIVILEGE_ESCALATION`).
- Chỉ superuser sửa vai trò hệ thống `is_system` (`IAM_SYSTEM_ROLE_PROTECTED`); mã vai trò không đổi được.
- Không thể vô hiệu hóa/hạ quyền superuser đang hoạt động cuối cùng (`ACCOUNT_LAST_SUPERUSER`, khóa dòng `SELECT FOR UPDATE`).
  Khôi phục khẩn cấp: `uv run python manage.py createsuperuser`.

## Vai trò hệ thống & vai trò theo module

Vai trò mẫu chỉ có hai loại, dựng tự động từ module registry (`RoleSeedService`,
`app/system/services/role_seed_service.py`; khai báo ở `app/system/constants/predefined_roles.py`). Không khai
vai trò nghiệp vụ tự đặt (tiếp thị, tác giả...): quản trị viên tự tạo trên trang Vai trò khi cần.

1. **`ADMIN` (vai trò hệ thống duy nhất):** mọi quyền đang hoạt động (`auto_grant="all"`, module cài sau tự
   được thêm). `RoleSeedService.seed(system_only=True)` tạo/chuẩn hóa sau mỗi `migrate` (post_migrate, kể cả sau
   `flush`) rồi gọi `sync_iam` cấp quyền. Không seed vai trò bằng data migration.
2. **Hai vai trò cho mỗi module có khai quyền**, tạo bằng lệnh (chạy lại được, chạy lại khi cài module hoặc thêm
   quyền mới):
   ```bash
   uv run python manage.py seed_roles
   ```
   | Mã | Tên | Quyền |
   | --- | --- | --- |
   | `<MÃ_MODULE>_MANAGER` | Quản lý `<tên module>` | mọi quyền của module (`<module>.*`) |
   | `<MÃ_MODULE>_VIEWER` | Xem `<tên module>` | chỉ quyền đọc của module (`<module>.*.read`) |
   | `<MÃ_MODULE>_MEMBER` | Thành viên `<tên module>` | `MEMBER` của từng class quyền, gom ở `ModuleDescriptor.member_permissions`: xem/tạo/sửa/xóa bản ghi **do mình tạo** (không có `manage_all`), danh mục dùng chung chỉ xem; xem [features/permission-scope.md](../features/permission-scope.md) |

   Hiện có: `SYSTEM_*`, `NOVEL_*`, `UTILITIES_*`, `FINANCE_*` (mỗi module ba vai trò). Dữ liệu "của mình" dựa trên
   `owner_field` + `manage_all_permission` của service (`CoreCrudService`); người có `manage_all` thấy của mọi người.
   Đây là vai trò thường (không phải hệ thống): sửa/xóa được; chạy lại `seed_roles` đưa tên/mô tả về mặc định và
   bổ sung quyền còn thiếu, không gỡ quyền quản trị viên đã thêm.

Mỗi model có **một file permission riêng** trong `permissions/<model>_permission.py` (kế thừa `PermissionCatalog`), không gộp chung nhiều model vào một file. Quyền khai báo bằng `PermissionDefinition(code, name, description)`; mô tả được lưu vào `system_permission.description`.

## API quản trị (`/api/v1`)

CRUD theo `CoreModelViewSet`: `GET/POST /<resource>`, `GET/PATCH/DELETE /<resource>/{id}`, và khi bật:
`POST /<resource>/bulk-update`, `POST /<resource>/bulk-delete`, `GET /<resource>/{id}/history`.

| Tài nguyên | Quyền |
| --- | --- |
| `/system/users` (+ bulk, history) | `system.user.{read,create,update,delete}` |
| `/system/users/{id}/roles` | đọc `system.role.read` hoặc `system.role.assign`; gán/gỡ và `PUT` thay toàn bộ (`role_ids`) `system.role.assign` |
| `/system/roles` (+ bulk, history) | `system.role.{read,create,update,delete}` |
| `/system/roles/{id}/permissions` (`PUT` thay toàn bộ `permission_ids`) | `system.permission.assign` |
| `/system/permissions` | `system.permission.read` |
| `/system/attachments`, `/system/attachments/folders` | `system.{attachment,attachment_folder}.{read,create,update,delete}`, `system.attachment.manage_all` |
| `/system/auth/admin-sessions` (+ `bulk-revoke`, `users`) | `system.session.{read,revoke,delete}` |
| `/system/journal-entries`, `/system/journal-resources` | `system.journal_entry.read` |
| `/utilities/short-links` (+ bulk, history) | `utilities.short_link.{read,create,update,delete,manage_all}` |
| `/utilities/qr-codes` (+ bulk, history), `/utilities/qr-codes/preview`, `/utilities/qr-codes/banks` | `utilities.qr_code.{read,create,update,delete,manage_all}` (`banks` chỉ cần đăng nhập) |
| `/utilities/page-paths` (+ history) | `utilities.page_path.{read,create,update,delete}` |
| `/utilities/pages` (+ `duplicate`, bulk, history) | `utilities.page.{read,create,update,delete,manage_all}` |
| `/novel/novels` (+ bulk, history), `/novel/novels/import-template`, `/novel/novels/import` | `novel.novel.{read,create,update,delete,manage_all,import}` |
| `/novel/chapters` (+ bulk) | `novel.chapter.{read,create,update,delete}` |
| `/novel/authors` (+ bulk) | `novel.author.{read,create,update,delete}` |
| `/novel/genres` (+ bulk) | `novel.genre.{read,create,update,delete}` |
| `/novel/tags` (+ bulk) | `novel.tag.{read,create,update,delete}` |

Công khai (ghi đè `permission_classes`): `/system/auth/csrf|login|refresh`, `/system/health`, `/utilities/short-links/resolve/{slug}`,
`/utilities/pages/public/{segment}/{slug}` (người có quyền đọc trang xem được bản nháp qua `?preview=1`),
`/system/health/cleanup` (khóa bằng `CRON_SECRET`).

Quyền tạo bởi module được khai báo trong `module.py` của module đó; không cần sửa IAM core.
Xoá người dùng và vai trò là xoá mềm, có quyền `delete` riêng; khoá tài khoản (`is_active=false`) vẫn là cách tạm
ngưng không mất dữ liệu. Gán/gỡ vai trò và quyền được ghi vào Journal. Form FE lưu vai trò/quyền bằng một `PUT`:
BE gán phần mới, gỡ phần bị bỏ trong **một transaction** theo cùng luật chống leo thang; lỗi một mục thì không đổi gì.

## Frontend

`usePermission(code)`, `useHasRole(code)` (đọc `roles` của `/system/auth/me`), `useCurrentUser()`,
`<PermissionGate permission="system.user.create">` chỉ
điều khiển hiển thị. Sau khi đổi vai trò/quyền, cache `authKeys.me()` được invalidate.
