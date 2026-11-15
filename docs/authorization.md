# Phân quyền (IAM / RBAC)

```
account.User ─< UserRole >─ Role ─< RolePermission >─ Permission (module.resource.action)
```

Tài khoản (`account.User`) thuộc module **Account**; IAM chỉ quản lý vai trò/quyền và phụ thuộc Account
(không có chiều ngược lại).

Nguồn sự thật duy nhất là các bảng IAM. Django `Group`/`Permission` (bảng của `django.contrib.auth`) vẫn tồn tại
do Django yêu cầu nhưng **không được dùng**. `AUTHENTICATION_BACKENDS` gồm hai backend tách trách nhiệm:

| Backend | Module | Việc |
| --- | --- | --- |
| `AccountAuthBackend` | account | `authenticate` (email + mật khẩu qua `UserService`), `get_user` |
| `IamPermissionBackend` | iam | `has_perm`, `has_module_perms` qua `PermissionChecker` |

`User.has_perm()` hỏi lần lượt các backend (chuẩn Django), nên Account không import IAM mà mọi API kiểu
Django vẫn dùng cùng nguồn quyền.

## Đánh giá quyền (`app/modules/iam/services/permission_checker.py`)

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
[rule backend](rules/backend.md) mục 3).

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

## Chống leo thang đặc quyền (`account/services/user_service.py`, `iam/services/user_role_service.py`, `role_service.py`, `role_permission_service.py`)

- Người không phải superuser không được đổi `is_active/is_staff/is_superuser` của **chính mình** (`ACCOUNT_SELF_MODIFICATION`)
  hay vai trò của chính mình (`IAM_SELF_MODIFICATION`).
- Bật/tắt `is_superuser` cần là superuser (`ACCOUNT_PRIVILEGE_ESCALATION`); chỉ superuser sửa tài khoản superuser
  (`ACCOUNT_SUPERUSER_PROTECTED`).
- Chỉ gán được vai trò mà mọi quyền của nó bạn đều có; chỉ cấp được quyền bạn đang có (`IAM_PRIVILEGE_ESCALATION`).
- Chỉ superuser sửa vai trò hệ thống `is_system` (`IAM_SYSTEM_ROLE_PROTECTED`); mã vai trò không đổi được.
- Không thể vô hiệu hóa/hạ quyền superuser đang hoạt động cuối cùng (`ACCOUNT_LAST_SUPERUSER`, khóa dòng `SELECT FOR UPDATE`).
  Khôi phục khẩn cấp: `uv run python manage.py createsuperuser`.

## Vai trò hệ thống

Được `sync_iam` (chạy sau mỗi `migrate`) đảm bảo tồn tại:
- `ADMIN`: mọi quyền đang hoạt động (module mới cài tự được thêm).
- `VIEWER`: mọi quyền `*.read`.

Vai trò hệ thống được seed bằng data migration `iam/0002_seed_system_roles`. Code không hardcode mã vai trò:
`sync_iam` cấp quyền cho **mọi** vai trò theo field `Role.auto_grant` (`all` / `read_only` / `none`).
Quyền khai báo bằng `PermissionDefinition(code, name, description)`; mô tả được lưu vào `iam_permission.description`.

## API quản trị (`/api/v1`)

CRUD theo `CoreModelViewSet`: `GET/POST /<resource>`, `GET/PATCH/DELETE /<resource>/{id}`, và khi bật:
`POST /<resource>/bulk-update`, `POST /<resource>/bulk-delete`, `GET /<resource>/{id}/history`.

| Tài nguyên | Quyền |
| --- | --- |
| `/account/users` (+ bulk, history) | `account.user.{read,create,update,delete}` |
| `/iam/users/{id}/roles` | đọc `iam.role.read` hoặc `iam.role.assign`; gán/gỡ và `PUT` thay toàn bộ (`role_ids`) `iam.role.assign` |
| `/iam/roles` (+ bulk, history) | `iam.role.{read,create,update,delete}` |
| `/iam/roles/{id}/permissions` (`PUT` thay toàn bộ `permission_ids`) | `iam.permission.assign` |
| `/iam/permissions` | `iam.permission.read` |
| `/attachments`, `/attachments/folders` | `attachment.{file,folder}.{read,create,update,delete}`, `attachment.file.manage_all` |
| `/auth/admin-sessions` (+ `bulk-revoke`, `users`) | `authentication.session.{read,revoke,delete}` |
| `/journal/entries`, `/journal/resources` | `journal.entry.read` |
| `/short-links/links` (+ bulk, history) | `short_links.link.{read,create,update,delete,manage_all}` |
| `/qr-codes/codes` (+ bulk, history), `/qr-codes/preview`, `/qr-codes/banks` | `qr_codes.code.{read,create,update,delete,manage_all}` |
| `/custom-pages/paths` | `custom_pages.path.{read,create,update,delete}` |
| `/custom-pages/pages` (+ `duplicate`, bulk, history) | `custom_pages.page.{read,create,update,delete,manage_all}` |

Công khai (ghi đè `permission_classes`): `/auth/csrf|login|refresh`, `/health`, `/short-links/resolve/{slug}`,
`/custom-pages/public/{segment}/{slug}` (người có quyền đọc trang xem được bản nháp qua `?preview=1`),
`/health/cleanup` (khóa bằng `CRON_SECRET`).

Quyền tạo bởi module được khai báo trong `module.py` của module đó; không cần sửa IAM core.
Xoá người dùng và vai trò là xoá mềm, có quyền `delete` riêng; khoá tài khoản (`is_active=false`) vẫn là cách tạm
ngưng không mất dữ liệu. Gán/gỡ vai trò và quyền được ghi vào Journal. Form FE lưu vai trò/quyền bằng một `PUT`:
BE gán phần mới, gỡ phần bị bỏ trong **một transaction** theo cùng luật chống leo thang; lỗi một mục thì không đổi gì.

## Frontend

`usePermission(code)`, `useHasRole(code)` (đọc `roles` của `/auth/me`), `useCurrentUser()`,
`<PermissionGate permission="account.user.create">` chỉ
điều khiển hiển thị. Sau khi đổi vai trò/quyền, cache `authKeys.me()` được invalidate.
