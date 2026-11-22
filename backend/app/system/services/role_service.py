"""Nghiệp vụ vai trò. Chỉ superuser được sửa vai trò hệ thống; mã vai trò không đổi."""

from typing import Any

from django.db import transaction
from django.db.models import QuerySet

from app.core.exceptions.authorization_error import AuthorizationError
from app.core.exceptions.conflict_error import ConflictError
from app.core.exceptions.not_found_error import NotFoundError
from app.core.services.core_crud_service import CoreCrudService
from app.system.constants.iam_error_code import IamErrorCode
from app.system.models.role import Role
from app.system.models.user import User
from app.system.repositories.role_repository import RoleRepository


class RoleService(CoreCrudService[Role, RoleRepository]):
    """Nghiệp vụ vai trò: CRUD, xóa mềm (trừ vai trò hệ thống), thao tác hàng loạt."""

    repository_class = RoleRepository

    def get_queryset(self) -> QuerySet[Role]:
        """Vai trò kèm số quyền, số người dùng.

        Returns:
            QuerySet.
        """
        return self.repository.get_queryset()

    def get_by_id(self, pk: Any) -> Role:
        """Chi tiết vai trò kèm quyền.

        Args:
            pk: Id vai trò.

        Returns:
            Vai trò.
        """
        return self.repository.get_detail(pk)

    def create(self, actor: User, data: dict[str, Any]) -> Role:
        """Tạo vai trò (không bao giờ là vai trò hệ thống).

        Args:
            actor: Người thực hiện.
            data: Dữ liệu đã qua RoleCreateValidateSerializer.

        Returns:
            Vai trò mới.

        Raises:
            ConflictError: Mã vai trò đã tồn tại.
        """
        if self.repository.exists(code=data["code"]):
            raise ConflictError("Mã vai trò đã tồn tại.", code=IamErrorCode.IAM_ROLE_CODE_EXISTS)
        return self.repository.create(actor=actor, is_system=False, **data)

    @transaction.atomic
    def update(self, actor: User, pk: Any, data: dict[str, Any]) -> Role:
        """Cập nhật tên, mô tả, trạng thái vai trò.

        Args:
            actor: Người thực hiện.
            pk: Id vai trò.
            data: Dữ liệu (partial).

        Returns:
            Vai trò sau cập nhật.
        """
        role = self.get_editable_role(actor, pk)
        return self.repository.update(role, actor=actor, **data)

    @transaction.atomic
    def delete(self, actor: User, pk: Any) -> None:
        """Xóa mềm vai trò tự tạo (tắt luôn để không còn cấp quyền).

        Args:
            actor: Người thực hiện.
            pk: Id vai trò.

        Raises:
            AuthorizationError: IAM_SYSTEM_ROLE_PROTECTED khi xóa vai trò hệ thống.
        """
        role = self.get_editable_role(actor, pk)
        if role.is_system:
            raise AuthorizationError(code=IamErrorCode.IAM_SYSTEM_ROLE_PROTECTED)
        self.repository.update(role, actor=actor, is_active=False)
        self.repository.delete(role, actor=actor)

    def get_editable_role(self, actor: User, role_id: Any) -> Role:
        """Khóa vai trò và chặn sửa vai trò hệ thống nếu không phải superuser.

        Args:
            actor: Người thực hiện.
            role_id: Id vai trò.

        Returns:
            Vai trò đã khóa dòng.

        Raises:
            NotFoundError: Không tồn tại.
            AuthorizationError: IAM_SYSTEM_ROLE_PROTECTED.
        """
        role = self.repository.get_for_update(role_id)
        if role.deleted_at is not None:
            raise NotFoundError()
        if role.is_system and not actor.is_superuser:
            raise AuthorizationError(code=IamErrorCode.IAM_SYSTEM_ROLE_PROTECTED)
        return role
