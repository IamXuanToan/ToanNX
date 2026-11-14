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

```python
# APIView: mỗi method khai báo quyền
class UserRoleView(AdminApiView):
    @require_permission(IamPermission.ROLE_ASSIGN)
    @validate_request(UserRoleAssignValidateSerializer)
    def post(self, request, user_id, validated_data): ...

# ViewSet: quyền theo action
class UserViewSet(AdminModelViewSet[User]):
    action_permissions = {
        "list": permission_rule(IamPermission.USER_READ),
        "create": permission_rule(IamPermission.USER_CREATE),
    }
```

`PermissionRule` (`iam/types/permission_rule.py`), dùng chung cho `@require_permission` và `permission_rule`:

| Tham số | Ngữ nghĩa |
| --- | --- |
| `*permissions` | Mặc định cần **ít nhất một** quyền |
| `require_all=True` | Cần **tất cả** quyền |
| `check=fn(request, view) -> bool` | Điều kiện bổ sung (AND), áp dụng cả với superuser |
| `allow_if=fn(request, view) -> bool` | Điều kiện thay thế (OR), ví dụ chính chủ |

Method không gắn `@require_permission` (APIView) hoặc action không có trong `action_permissions` (ViewSet) bị từ chối
(`HasDeclaredPermission`, `HasActionPermission`). Mặc định toàn hệ thống (`DEFAULT_PERMISSION_CLASSES`)
là `IsActiveAuthenticated`; endpoint công khai kế thừa `PublicApiView`/`CsrfPublicApiView`.

| Mã lỗi | Khi nào |
| --- | --- |
| 401 `AUTH_NOT_AUTHENTICATED` | Chưa đăng nhập |
| 403 `ADMIN_ACCESS_REQUIRED` | Không phải staff/superuser |
| 403 `PERMISSION_DENIED` | Thiếu quyền (`details.permissions`: danh sách mã quyền yêu cầu) |

## Cờ người dùng

| Cờ | Ý nghĩa |
| --- | --- |
| `is_superuser` | Toàn quyền tầng ứng dụng. Chỉ superuser được bật/tắt cờ này và sửa tài khoản superuser. |
| `is_staff` | Được vào khu vực quản trị; từng chức năng vẫn cần quyền. |
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

| Method | Path | Quyền |
| --- | --- | --- |
| GET/POST | `/account/users` | `account.user.read` / `account.user.create` |
| GET/PATCH | `/account/users/{id}` | `account.user.read` / `account.user.update` |
| GET | `/iam/users/{id}/roles` | `iam.role.read` hoặc `iam.role.assign` |
| POST | `/iam/users/{id}/roles` | `iam.role.assign` |
| DELETE | `/iam/users/{id}/roles/{role_id}` | `iam.role.assign` |
| GET/POST | `/iam/roles` | `iam.role.read` / `iam.role.create` |
| GET/PATCH | `/iam/roles/{id}` | `iam.role.read` / `iam.role.update` |
| POST | `/iam/roles/{id}/permissions` | `iam.permission.assign` |
| DELETE | `/iam/roles/{id}/permissions/{permission_id}` | `iam.permission.assign` |
| GET | `/iam/permissions`, `/iam/permissions/{id}` | `iam.permission.read` |
| GET/POST | `/attachments` | `attachment.file.read` / `attachment.file.create` |
| GET/DELETE | `/attachments/{id}` | `attachment.file.read` / `attachment.file.delete` |
| GET / PATCH | `/system/modules`, `/system/modules/{code}` (bật/tắt, icon) | `system.module.read` / `system.module.manage` |

Quyền tạo bởi module được khai báo trong `module.py` của module đó; không cần sửa IAM core.
Không tạo quyền `delete` vì chưa có API xóa (người dùng bị khóa thay vì xóa).

## Frontend

`usePermission(code)`, `useHasRole(code)` (đọc `roles` của `/auth/me`), `useCurrentUser()`,
`<PermissionGate permission="account.user.create">` chỉ
điều khiển hiển thị. Sau khi đổi vai trò/quyền, cache `authKeys.me()` được invalidate.
