"""Nghiệp vụ gán/thu hồi quyền cho vai trò. Chỉ cấp được quyền mà người thực hiện đang có."""

from typing import Any

from django.db import transaction

from app.core.exceptions.authorization_error import AuthorizationError
from app.core.exceptions.not_found_error import NotFoundError
from app.modules.account.models.user import User
from app.modules.iam.constants.iam_error_code import IamErrorCode
from app.modules.iam.models.role import Role
from app.modules.iam.repositories.permission_repository import PermissionRepository
from app.modules.iam.repositories.role_permission_repository import RolePermissionRepository
from app.modules.iam.services.permission_checker import PermissionChecker, permission_checker
from app.modules.iam.services.role_service import RoleService


class RolePermissionService:
    """Nghiệp vụ RolePermission."""

    def __init__(
        self,
        repository: RolePermissionRepository | None = None,
        permission_repository: PermissionRepository | None = None,
        role_service: RoleService | None = None,
        checker: PermissionChecker | None = None,
    ) -> None:
        """Khởi tạo service.

        Args:
            repository: Repository gán quyền.
            permission_repository: Repository quyền.
            role_service: Service vai trò (kiểm tra vai trò hệ thống).
            checker: Bộ kiểm tra quyền.
        """
        self.repository = repository or RolePermissionRepository()
        self.permission_repository = permission_repository or PermissionRepository()
        self.role_service = role_service or RoleService()
        self.checker = checker or permission_checker

    @transaction.atomic
    def assign_permission(self, actor: User, role_id: Any, permission_id: Any) -> Role:
        """Gán quyền cho vai trò (idempotent).

        Args:
            actor: Người thực hiện.
            role_id: Id vai trò.
            permission_id: Id quyền.

        Returns:
            Vai trò.
        """
        role = self.role_service.get_editable_role(actor, role_id)
        permission = self.permission_repository.get_by_id(permission_id)
        if not self.checker.has_permission(actor, permission.code):
            raise AuthorizationError(
                "Bạn không thể cấp quyền mà bạn không có.",
                code=IamErrorCode.IAM_PRIVILEGE_ESCALATION,
                details={"permissions": [permission.code]},
            )
        if not self.repository.exists(role=role, permission=permission):
            self.repository.create(actor=actor, role=role, permission=permission)
            role.journal_event("iam.permission_assigned", {"permission": permission.code}, actor.pk)
        return role

    @transaction.atomic
    def sync_permissions(self, actor: User, role_id: Any, permission_ids: list[Any]) -> Role:
        """Đưa quyền của vai trò về đúng danh sách trong **một transaction**.

        Gán phần mới, gỡ phần bị bỏ bằng đúng luật của `assign_permission` / `revoke_permission`; một quyền
        lỗi thì không thay đổi nào được lưu.

        Args:
            actor: Người thực hiện.
            role_id: Id vai trò.
            permission_ids: Toàn bộ id quyền mong muốn.

        Returns:
            Vai trò.
        """
        role = self.role_service.get_editable_role(actor, role_id)
        wanted = {str(pk) for pk in permission_ids}
        current = {str(pk) for pk in self.repository.values_list("permission_id", role_id=role.pk)}
        for permission_id in sorted(wanted - current):
            self.assign_permission(actor, role.pk, permission_id)
        for permission_id in sorted(current - wanted):
            self.revoke_permission(actor, role.pk, permission_id)
        return role

    @transaction.atomic
    def revoke_permission(self, actor: User, role_id: Any, permission_id: Any) -> None:
        """Thu hồi quyền khỏi vai trò.

        Args:
            actor: Người thực hiện.
            role_id: Id vai trò.
            permission_id: Id quyền.

        Raises:
            NotFoundError: Vai trò không có quyền này.
        """
        role = self.role_service.get_editable_role(actor, role_id)
        if self.repository.remove(role.pk, permission_id) == 0:
            raise NotFoundError()
        role.journal_event("iam.permission_revoked", {"permission_id": str(permission_id)}, actor.pk)
