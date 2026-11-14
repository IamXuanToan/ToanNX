"""Lớp gốc cho danh mục quyền của một module."""

from app.core.registry.permission_definition import PermissionDefinition


class PermissionCatalog:
    """Gom các `PermissionDefinition` khai báo dạng thuộc tính lớp.

    ```python
    class IamPermission(PermissionCatalog):
        USER_READ = PermissionDefinition("account.user.read", "Xem người dùng", "Xem danh sách ...")
    ```
    """

    @classmethod
    def all(cls) -> tuple[PermissionDefinition, ...]:
        """Tất cả quyền khai báo trong lớp (theo thứ tự khai báo).

        Returns:
            Tuple định nghĩa quyền.
        """
        return tuple(value for value in vars(cls).values() if isinstance(value, PermissionDefinition))
