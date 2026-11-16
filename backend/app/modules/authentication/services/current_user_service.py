"""Dựng hồ sơ người dùng hiện tại cho `/auth/me`, login và refresh."""

from typing import Any

from app.modules.account.models.user import User
from app.modules.account.services.user_service import UserService
from app.modules.authentication.types.current_user_profile import CurrentUserProfile
from app.modules.iam.services.permission_checker import PermissionChecker, permission_checker
from app.modules.iam.services.user_role_service import UserRoleService


class CurrentUserService:
    """Gom người dùng (Account) với vai trò và quyền hiệu lực (IAM)."""

    def __init__(
        self,
        user_service: UserService | None = None,
        user_role_service: UserRoleService | None = None,
        checker: PermissionChecker | None = None,
    ) -> None:
        """Khởi tạo service.

        Args:
            user_service: Service người dùng.
            user_role_service: Service vai trò của người dùng.
            checker: Bộ kiểm tra quyền.
        """
        self.user_service = user_service or UserService()
        self.user_role_service = user_role_service or UserRoleService(user_service=self.user_service)
        self.checker = checker or permission_checker

    def get_profile(self, user: User) -> CurrentUserProfile:
        """Hồ sơ của người dùng đã nạp sẵn (người dùng của request): không đọc lại bảng người dùng.

        Args:
            user: Người dùng.

        Returns:
            Hồ sơ.
        """
        return CurrentUserProfile(
            user=user,
            roles=self.user_role_service.roles_for(user),
            permissions=sorted(self.checker.get_permissions(user)),
        )

    def get_profile_by_id(self, user_id: Any) -> CurrentUserProfile:
        """Hồ sơ theo id (đăng nhập, refresh: chưa có người dùng của request).

        Args:
            user_id: Id người dùng.

        Returns:
            Hồ sơ.
        """
        return self.get_profile(self.user_service.get_by_id(user_id))

    def update_profile(self, user: User, data: dict[str, Any]) -> CurrentUserProfile:
        """Cập nhật thông tin hồ sơ của chính người dùng hiện tại.

        Args:
            user: Người dùng hiện tại.
            data: Dữ liệu cần cập nhật đã qua validate.

        Returns:
            Hồ sơ người dùng mới nhất sau khi cập nhật.
        """
        updated = self.user_service.update(actor=user, pk=user.pk, data=data)
        return self.get_profile(updated)
