"""Nghiệp vụ gán/thu hồi vai trò của người dùng.

- Người không phải superuser không được đổi vai trò của chính mình.
- Người không phải superuser chỉ gán được vai trò mà bản thân có đủ mọi quyền của nó.
"""

from typing import Any

from django.db import transaction

from app.core.constants.error_codes import ErrorCode
from app.core.exceptions.authorization_error import AuthorizationError
from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.exceptions.not_found_error import NotFoundError
from app.modules.account.models.user import User
from app.modules.account.services.user_service import UserService
from app.modules.iam.models.role import Role
from app.modules.iam.repositories.permission_repository import PermissionRepository
from app.modules.iam.repositories.role_repository import RoleRepository
from app.modules.iam.repositories.user_role_repository import UserRoleRepository
from app.modules.iam.services.permission_checker import PermissionChecker, permission_checker


class UserRoleService:
    """Nghiệp vụ UserRole."""

    def __init__(
        self,
        repository: UserRoleRepository | None = None,
        role_repository: RoleRepository | None = None,
        permission_repository: PermissionRepository | None = None,
        user_service: UserService | None = None,
        checker: PermissionChecker | None = None,
    ) -> None:
        """Khởi tạo service.

        Args:
            repository: Repository gán vai trò.
            role_repository: Repository vai trò.
            permission_repository: Repository quyền.
            user_service: Service người dùng (kiểm tra quyền trên người dùng đích).
            checker: Bộ kiểm tra quyền.
        """
        self.repository = repository or UserRoleRepository()
        self.role_repository = role_repository or RoleRepository()
        self.permission_repository = permission_repository or PermissionRepository()
        self.user_service = user_service or UserService()
        self.checker = checker or permission_checker

    def list_roles(self, user_id: Any) -> list[Role]:
        """Vai trò đang gán cho người dùng.

        Args:
            user_id: Id người dùng.

        Returns:
            Danh sách vai trò.

        Raises:
            NotFoundError: Người dùng không tồn tại.
        """
        self.user_service.get_by_id(user_id)
        return self.role_repository.list_for_user(user_id)

    @transaction.atomic
    def assign_role(self, actor: User, user_id: Any, role_id: Any) -> User:
        """Gán vai trò cho người dùng (idempotent).

        Args:
            actor: Người thực hiện.
            user_id: Id người dùng.
            role_id: Id vai trò.

        Returns:
            Người dùng.
        """
        target = self._get_target(actor, user_id)
        role = self.role_repository.get_by_id(role_id)
        if not role.is_active:
            raise BusinessRuleError("Vai trò đang bị tắt.", code=ErrorCode.IAM_ROLE_INACTIVE)

        if not actor.is_superuser:
            missing = self.permission_repository.get_codes_for_role(role.pk) - self.checker.get_permissions(
                actor
            )
            if missing:
                raise AuthorizationError(
                    "Bạn không thể gán vai trò có quyền vượt quá quyền của bạn.",
                    code=ErrorCode.IAM_PRIVILEGE_ESCALATION,
                    details={"permissions": sorted(missing)},
                )

        if not self.repository.exists(user=target, role=role):
            self.repository.create(actor=actor, user=target, role=role)
        return target

    @transaction.atomic
    def revoke_role(self, actor: User, user_id: Any, role_id: Any) -> None:
        """Thu hồi vai trò của người dùng.

        Args:
            actor: Người thực hiện.
            user_id: Id người dùng.
            role_id: Id vai trò.

        Raises:
            NotFoundError: Người dùng không có vai trò này.
        """
        target = self._get_target(actor, user_id)
        role = self.role_repository.get_by_id(role_id)
        if role.is_system and not actor.is_superuser:
            raise AuthorizationError(code=ErrorCode.IAM_SYSTEM_ROLE_PROTECTED)
        if self.repository.remove(target.pk, role.pk) == 0:
            raise NotFoundError()

    def _get_target(self, actor: User, user_id: Any) -> User:
        """Người dùng đích + chặn tự đổi vai trò của chính mình."""
        target = self.user_service.get_manageable_user(actor, user_id)
        if actor.pk == target.pk and not actor.is_superuser:
            raise AuthorizationError(code=ErrorCode.IAM_SELF_MODIFICATION)
        return target
