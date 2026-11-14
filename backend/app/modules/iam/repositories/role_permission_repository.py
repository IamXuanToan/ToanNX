"""Repository gán quyền cho vai trò."""

from collections.abc import Iterable
from typing import Any

from app.core.repositories.core_repository import CoreRepository
from app.modules.iam.models.permission import Permission
from app.modules.iam.models.role import Role
from app.modules.iam.models.role_permission import RolePermission


class RolePermissionRepository(CoreRepository[RolePermission]):
    """Truy cập dữ liệu RolePermission (xóa cứng khi thu hồi)."""

    model = RolePermission

    def remove(self, role_id: Any, permission_id: Any) -> int:
        """Thu hồi quyền khỏi vai trò.

        Args:
            role_id: Id vai trò.
            permission_id: Id quyền.

        Returns:
            Số bản ghi đã xóa.
        """
        return self.delete_where(role_id=role_id, permission_id=permission_id)

    def add_missing(self, role: Role, permissions: Iterable[Permission]) -> int:
        """Gán các quyền vai trò chưa có.

        Args:
            role: Vai trò.
            permissions: Quyền cần có.

        Returns:
            Số quyền được thêm.
        """
        existing = set(self.values_list("permission_id", role=role))
        missing = [item for item in permissions if item.pk not in existing]
        self.bulk_create(RolePermission(role=role, permission=item) for item in missing)
        return len(missing)
