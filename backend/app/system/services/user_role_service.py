"""Nghiệp vụ gán/thu hồi vai trò của người dùng.

- Người không phải superuser không được đổi vai trò của chính mình.
- Người không phải superuser chỉ gán được vai trò mà bản thân có đủ mọi quyền của nó.
"""

from typing import Any

from django.db import transaction

from app.core.exceptions.authorization_error import AuthorizationError
from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.exceptions.not_found_error import NotFoundError
from app.system.constants.iam_error_code import IamErrorCode
from app.system.models.role import Role
from app.system.models.user import User
from app.system.models.user_role import UserRole
from app.system.repositories.permission_repository import PermissionRepository
from app.system.repositories.role_repository import RoleRepository
from app.system.repositories.user_role_repository import UserRoleRepository
from app.system.services.permission_checker import PermissionChecker, permission_checker
from app.system.services.user_service import UserService


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

    def roles_for(self, user: User) -> list[Role]:
        """Vai trò của người dùng đã nạp sẵn (không kiểm lại người dùng có tồn tại).

        Args:
            user: Người dùng.

        Returns:
            Danh sách vai trò.
        """
        return self.role_repository.list_for_user(user.pk)

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
            raise BusinessRuleError("Vai trò đang bị tắt.", code=IamErrorCode.IAM_ROLE_INACTIVE)

        if not actor.is_superuser:
            missing = self.permission_repository.get_codes_for_role(role.pk) - self.checker.get_permissions(
                actor
            )
            if missing:
                raise AuthorizationError(
                    "Bạn không thể gán vai trò có quyền vượt quá quyền của bạn.",
                    code=IamErrorCode.IAM_PRIVILEGE_ESCALATION,
                    details={"permissions": sorted(missing)},
                )

        if not self.repository.exists(user=target, role=role):
            self.repository.create(actor=actor, user=target, role=role)
            target.journal_event("system.role_assigned", {"role": role.code}, actor.pk)
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
            raise AuthorizationError(code=IamErrorCode.IAM_SYSTEM_ROLE_PROTECTED)
        if self.repository.remove(target.pk, role.pk) == 0:
            raise NotFoundError()
        target.journal_event("system.role_revoked", {"role": role.code}, actor.pk)

    @transaction.atomic
    def sync_roles(self, actor: User, user_id: Any, role_ids: list[Any]) -> list[Role]:
        """Đưa vai trò của người dùng về đúng danh sách trong **một transaction** (số query cố định).

        Cùng luật với `assign_role` / `revoke_role`: không tự đổi vai trò của mình, vai trò phải đang bật,
        chỉ gán vai trò mình có đủ quyền, vai trò hệ thống chỉ superuser gỡ.
        Lỗi thì không thay đổi nào được lưu.
        Journal ghi một sự kiện `iam.roles_changed` với danh sách mã vai trò trước và sau khi lưu.

        Args:
            actor: Người thực hiện.
            user_id: Id người dùng.
            role_ids: Toàn bộ id vai trò mong muốn.

        Returns:
            Vai trò của người dùng sau khi đồng bộ.

        Raises:
            NotFoundError: Có id vai trò không tồn tại.
            BusinessRuleError: Vai trò đang tắt.
            AuthorizationError: Vượt quyền hoặc gỡ vai trò hệ thống.
        """
        target = self._get_target(actor, user_id)
        wanted = {str(pk) for pk in role_ids}
        current = self.repository.role_codes(target.pk)
        added_ids, removed_ids = wanted - current.keys(), current.keys() - wanted
        added = list(self.role_repository.filter(pk__in=list(added_ids))) if added_ids else []
        if len(added) != len(added_ids):
            raise NotFoundError()
        if any(not role.is_active for role in added):
            raise BusinessRuleError("Vai trò đang bị tắt.", code=IamErrorCode.IAM_ROLE_INACTIVE)
        if not actor.is_superuser:
            if any(current[pk][1] for pk in removed_ids):
                raise AuthorizationError(code=IamErrorCode.IAM_SYSTEM_ROLE_PROTECTED)
            needed = (
                self.permission_repository.get_codes_for_roles(role.pk for role in added) if added else set()
            )
            missing = needed - self.checker.get_permissions(actor)
            if missing:
                raise AuthorizationError(
                    "Bạn không thể gán vai trò có quyền vượt quá quyền của bạn.",
                    code=IamErrorCode.IAM_PRIVILEGE_ESCALATION,
                    details={"permissions": sorted(missing)},
                )
        if added:
            self.repository.bulk_create((UserRole(user=target, role=role) for role in added), actor=actor)
        if removed_ids:
            self.repository.remove_many(target.pk, removed_ids)
        if added or removed_ids:
            before = sorted(code for code, _ in current.values())
            after = {code for pk, (code, _) in current.items() if pk not in removed_ids} | {
                r.code for r in added
            }
            target.journal_event(
                "system.roles_changed", actor_id=actor.pk, changes={"roles": (before, sorted(after))}
            )
        return self.role_repository.list_for_user(target.pk)

    def _get_target(self, actor: User, user_id: Any) -> User:
        """Người dùng đích + chặn tự đổi vai trò của chính mình."""
        target = self.user_service.get_manageable_user(actor, user_id)
        if actor.pk == target.pk and not actor.is_superuser:
            raise AuthorizationError(code=IamErrorCode.IAM_SELF_MODIFICATION)
        return target
