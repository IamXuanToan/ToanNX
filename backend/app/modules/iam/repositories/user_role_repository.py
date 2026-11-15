"""Repository gán vai trò cho người dùng."""

from collections.abc import Iterable
from typing import Any

from app.core.repositories.core_repository import CoreRepository
from app.modules.iam.models.user_role import UserRole


class UserRoleRepository(CoreRepository[UserRole]):
    """Truy cập dữ liệu UserRole (xóa cứng khi thu hồi)."""

    model = UserRole

    def role_codes(self, user_id: Any) -> dict[str, tuple[str, bool]]:
        """Vai trò còn sống đang gán cho người dùng (một query).

        Args:
            user_id: Id người dùng.

        Returns:
            `{id vai trò dạng chuỗi: (mã, là vai trò hệ thống)}`.
        """
        rows = self.filter(user_id=user_id, role__deleted_at__isnull=True).values_list(
            "role_id", "role__code", "role__is_system"
        )
        return {str(pk): (code, is_system) for pk, code, is_system in rows}

    def remove_many(self, user_id: Any, role_ids: Iterable[Any]) -> int:
        """Gỡ nhiều vai trò của người dùng bằng một lệnh.

        Args:
            user_id: Id người dùng.
            role_ids: Id vai trò.

        Returns:
            Số bản ghi đã xóa.
        """
        # Xóa cứng có chủ đích: bảng nối, lịch sử gán/gỡ đã ghi ở journal (sự kiện của User).
        return self.hard_delete_where(user_id=user_id, role_id__in=list(role_ids))

    def remove(self, user_id: Any, role_id: Any) -> int:
        """Thu hồi vai trò.

        Args:
            user_id: Id người dùng.
            role_id: Id vai trò.

        Returns:
            Số bản ghi đã xóa.
        """
        # Xóa cứng có chủ đích: bảng nối, lịch sử gán/gỡ đã ghi ở journal (sự kiện của User).
        return self.hard_delete_where(user_id=user_id, role_id=role_id)
