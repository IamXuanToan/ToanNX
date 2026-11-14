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
        return self.delete_where(user_id=user_id, role_id=role_id)
