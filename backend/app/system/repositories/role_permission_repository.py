"""Repository gán quyền cho vai trò."""

from collections.abc import Iterable
from typing import Any

from app.core.repositories.core_repository import CoreRepository
from app.system.models.permission import Permission
from app.system.models.role import Role
from app.system.models.role_permission import RolePermission


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
        # Xóa cứng có chủ đích: bảng nối, lịch sử gán/gỡ đã ghi ở journal (sự kiện của Role).
        return self.hard_delete_where(role_id=role_id, permission_id=permission_id)

    def permission_codes(self, role_id: Any) -> dict[str, str]:
        """Quyền hiệu lực đang gán cho vai trò (một query).

        Args:
            role_id: Id vai trò.

        Returns:
            `{id quyền dạng chuỗi: mã quyền}`.
        """
        rows = self.model._default_manager.filter(role_id=role_id, permission__is_active=True).values_list(
            "permission_id", "permission__code"
        )
        return {str(pk): code for pk, code in rows}

    def remove_except(self, role_id: Any, permission_ids: Iterable[Any]) -> int:
        """Gỡ các quyền không nằm trong danh sách giữ lại (làm sạch quyền cũ/vô hiệu ở vai trò tự cấp).

        Args:
            role_id: Id vai trò.
            permission_ids: Tập id quyền hợp lệ được giữ lại.

        Returns:
            Số bản ghi đã xóa.
        """
        kept = list(permission_ids)
        # Xóa cứng có chủ đích: bảng nối RolePermission không dùng xóa mềm.
        deleted, _ = (
            self.model._default_manager.filter(role_id=role_id).exclude(permission_id__in=kept).delete()
        )
        return deleted

    def remove_many(self, role_id: Any, permission_ids: Iterable[Any]) -> int:
        """Gỡ nhiều quyền khỏi vai trò bằng một lệnh.

        Args:
            role_id: Id vai trò.
            permission_ids: Id quyền.

        Returns:
            Số bản ghi đã xóa.
        """
        # Xóa cứng có chủ đích: bảng nối, lịch sử gán/gỡ đã ghi ở journal (sự kiện của Role).
        return self.hard_delete_where(role_id=role_id, permission_id__in=list(permission_ids))

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
