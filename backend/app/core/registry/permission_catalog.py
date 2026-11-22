"""Lớp gốc cho danh mục quyền của một module."""

from app.core.registry.permission_definition import PermissionDefinition


class PermissionCatalog:
    """Gom các `PermissionDefinition` khai báo dạng thuộc tính lớp.

    ```python
    class IamPermission(PermissionCatalog):
        USER_READ = PermissionDefinition("system.user.read", "Xem người dùng", "Xem danh sách ...")
        USER_UPDATE = PermissionDefinition("system.user.update", "Sửa người dùng", "...")

        # Quyền của vai trò `<MODULE>_MEMBER`: thao tác bản ghi do mình tạo (không gồm `manage_all`).
        MEMBER = (USER_READ, USER_UPDATE)
    ```

    Phạm vi "của mình" không phải một quyền riêng: người không có `<module>.<resource>.manage_all` chỉ thấy và
    thao tác bản ghi có owner là mình (`CoreCrudService.owner_field`). `MEMBER` chỉ chọn các quyền thao tác.
    """

    # Lớp con ghi đè; để trống = tài nguyên không cấp cho vai trò thành viên.
    MEMBER: tuple[PermissionDefinition, ...] = ()

    @classmethod
    def all(cls) -> tuple[PermissionDefinition, ...]:
        """Tất cả quyền khai báo trong lớp (theo thứ tự khai báo).

        Returns:
            Tuple định nghĩa quyền.
        """
        return tuple(value for value in vars(cls).values() if isinstance(value, PermissionDefinition))

    @classmethod
    def member(cls) -> tuple[PermissionDefinition, ...]:
        """Quyền của vai trò `<MODULE>_MEMBER` mà tài nguyên này cấp (khai ở `MEMBER`).

        Returns:
            Tuple định nghĩa quyền.
        """
        return cls.MEMBER
