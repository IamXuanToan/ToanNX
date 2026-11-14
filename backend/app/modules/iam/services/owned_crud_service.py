"""Service CRUD cho tài nguyên có owner và xóa mềm (quyền `manage_all` kiểm tra qua IAM)."""

from typing import Any

from django.db import models, transaction
from django.db.models import QuerySet

from app.core.exceptions.not_found_error import NotFoundError
from app.core.repositories.core_repository import CoreRepository
from app.core.services.core_crud_service import CoreCrudService
from app.modules.iam.services.permission_checker import PermissionChecker, permission_checker


class OwnedCrudService[M: models.Model, R: CoreRepository[Any]](CoreCrudService[M, R]):
    """Giới hạn đọc/ghi theo owner; quyền manage_all cho phép truy cập mọi owner."""

    manage_all_permission: str

    def __init__(self, repository: R | None = None, checker: PermissionChecker | None = None) -> None:
        """Khởi tạo service.

        Args:
            repository: Repository (test có thể truyền bản giả).
            checker: Bộ kiểm tra quyền IAM.
        """
        super().__init__(repository)
        self.checker = checker or permission_checker

    def get_queryset_for(self, actor: Any) -> QuerySet[M]:
        """Trả danh sách của actor hoặc toàn bộ nếu actor có manage_all."""
        queryset = self.repository.get_queryset()
        if self.checker.has_permission(actor, self.manage_all_permission):
            return queryset
        return queryset.filter(owner_id=actor.pk)

    def get_by_id_for(self, actor: Any, pk: Any) -> M:
        """Đọc một tài nguyên; trả 404 cả khi tài nguyên thuộc người khác."""
        instance = self.repository.get_by_id(pk)
        if not self._can_access(actor, instance):
            raise NotFoundError()
        return instance

    def _can_access(self, actor: Any, instance: M) -> bool:
        """Owner hoặc người có quyền quản lý mọi tài nguyên."""
        return bool(
            actor.pk == getattr(instance, "owner_id", None)
            or self.checker.has_permission(actor, self.manage_all_permission)
        )

    @transaction.atomic
    def create(self, actor: Any, data: dict[str, Any]) -> M:
        """Tạo tài nguyên với owner lấy từ phiên, không nhận owner từ client."""
        return self.repository.create(actor=actor, owner=actor, **data)

    @transaction.atomic
    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> M:
        """Khóa dòng, kiểm tra owner rồi cập nhật."""
        instance = self.repository.get_for_update(pk)
        if getattr(instance, "deleted_at", None) is not None or not self._can_access(actor, instance):
            raise NotFoundError()
        return self.repository.update(instance, actor=actor, **data)

    @transaction.atomic
    def delete(self, actor: Any, pk: Any) -> None:
        """Khóa dòng, kiểm tra owner rồi xóa mềm."""
        instance = self.repository.get_for_update(pk)
        if getattr(instance, "deleted_at", None) is not None or not self._can_access(actor, instance):
            raise NotFoundError()
        self.repository.soft_delete(instance, actor=actor)
