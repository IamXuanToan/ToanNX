"""Dựng hồ sơ người dùng hiện tại cho `/auth/me`, login và refresh."""

from typing import Any

from app.modules.account.services.user_service import UserService
from app.modules.authentication.types.current_user_profile import CurrentUserProfile
from app.modules.iam.services.permission_checker import PermissionChecker, permission_checker
from app.modules.iam.services.user_role_service import UserRoleService
from app.modules.system.services.system_module_service import SystemModuleService


class CurrentUserService:
    """Gom người dùng (Account), vai trò + quyền hiệu lực (IAM) và module đang bật (System)."""

    def __init__(
        self,
        user_service: UserService | None = None,
        system_module_service: SystemModuleService | None = None,
        user_role_service: UserRoleService | None = None,
        checker: PermissionChecker | None = None,
    ) -> None:
        """Khởi tạo service.

        Args:
            user_service: Service người dùng.
            system_module_service: Service module.
            user_role_service: Service vai trò của người dùng.
            checker: Bộ kiểm tra quyền.
        """
        self.user_service = user_service or UserService()
        self.system_module_service = system_module_service or SystemModuleService()
        self.user_role_service = user_role_service or UserRoleService(user_service=self.user_service)
        self.checker = checker or permission_checker

    def get_profile(self, user_id: Any) -> CurrentUserProfile:
        """Hồ sơ người dùng hiện tại.

        Args:
            user_id: Id người dùng.

        Returns:
            Hồ sơ.
        """
        user = self.user_service.get_by_id(user_id)
        return CurrentUserProfile(
            user=user,
            roles=self.user_role_service.list_roles(user.pk),
            permissions=sorted(self.checker.get_permissions(user)),
            modules=[state for state in self.system_module_service.list_modules() if state.enabled],
        )
