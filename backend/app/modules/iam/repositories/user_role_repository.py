"""Repository gán vai trò cho người dùng."""

from typing import Any

from app.core.repositories.core_repository import CoreRepository
from app.modules.iam.models.user_role import UserRole


class UserRoleRepository(CoreRepository[UserRole]):
    """Truy cập dữ liệu UserRole (xóa cứng khi thu hồi)."""

    model = UserRole

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
