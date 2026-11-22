# Phạm vi quyền: của mình và của mọi người

## Chức năng

Một người dùng thao tác được tài nguyên nào do hai thứ quyết định:

1. **Quyền thao tác** `<module>.<resource>.<action>` (`read`, `create`, `update`, `delete`…): được làm gì.
2. **Phạm vi**: thao tác trên bản ghi của ai. Phạm vi không phải vai trò riêng mà là quyền
   `<module>.<resource>.manage_all`:
   - Không có `manage_all`: chỉ thấy và thao tác bản ghi có owner là mình. Bản ghi của người khác trả 404
     (không lộ là có tồn tại).
   - Có `manage_all`: thấy và thao tác bản ghi của mọi người (vẫn cần quyền thao tác tương ứng).
   - Tài nguyên dùng chung (không có owner, ví dụ tiền tệ, thể loại truyện) không có khái niệm phạm vi.

Superuser bỏ qua mọi kiểm tra. `is_staff` chỉ mở khung quản trị ở FE, API không xét.

## Ba vai trò dựng sẵn mỗi module

Sinh bởi `RoleSeedService` (`uv run python manage.py seed_roles`), không tự đặt thêm:

| Vai trò | Quyền |
| --- | --- |
| `<MODULE>_MANAGER` | Mọi quyền của module, gồm `manage_all` |
| `<MODULE>_VIEWER` | Mọi quyền `read` của module |
| `<MODULE>_MEMBER` | Quyền khai ở `MEMBER` của từng class quyền: thao tác bản ghi của mình |

Ngoài ra có `ADMIN` (vai trò hệ thống, mọi quyền).

## Khai báo quyền thành viên

Mỗi tài nguyên tự khai trong class quyền của nó, module chỉ gom lại:

```python
# app/system/permissions/attachment_permission.py
class AttachmentPermission(PermissionCatalog):
    FILE_READ = PermissionDefinition("system.attachment.read", "Xem file", "...")
    FILE_CREATE = ...
    FILE_UPDATE = ...
    FILE_DELETE = ...
    FILE_MANAGE_ALL = ...    # mở phạm vi: không bao giờ vào MEMBER
    FILE_READ_PRIVATE = ...  # mở phạm vi file riêng tư: không bao giờ vào MEMBER

    MEMBER = (FILE_READ, FILE_CREATE, FILE_UPDATE, FILE_DELETE)

# app/system/module.py
MODULE = ModuleDescriptor(
    ...,
    permissions=(*AttachmentPermission.all(), ...),
    member_permissions=(*AttachmentPermission.member(), ...),
)
```

- `PermissionCatalog.MEMBER` mặc định `()`: tài nguyên không cấp cho thành viên (ví dụ `UserPermission`,
  `IamPermission`) thì không khai.
- `ModuleDescriptor.validate()` từ chối khi: module có quyền mà `member_permissions` rỗng; quyền thành viên không
  nằm trong `permissions`; quyền thành viên là `manage_all` hoặc `read_private`.
- Không khai `member_permissions` bằng chuỗi hay mẫu `*`.

## Phía service (BE)

`CoreCrudService` khai ba thuộc tính, không viết lại logic lọc:

```python
class ShortLinkService(CoreCrudService[ShortLink, ShortLinkRepository]):
    owner_field = "owner"                                         # None = tài nguyên chung
    manage_all_permission = ShortLinkPermission.MANAGE_ALL.code
    owner_quota_setting = "SHORT_LINK_MAX_PER_OWNER"
```

`get_queryset_for(actor)` / `get_by_id_for(actor, pk)` / `can_access(actor, instance)` tự lọc theo owner.

## File chính

- `backend/app/core/registry/permission_catalog.py`, `module_descriptor.py`
- `backend/app/system/services/role_seed_service.py`
- `backend/app/core/services/core_crud_service.py`
- Test: `backend/app/core/tests/test_module_registry.py`, `backend/app/system/tests/test_role_seed_service.py`

Liên quan: [permission-ui.md](permission-ui.md), [../architecture/authorization.md](../architecture/authorization.md),
rule backend §4.
