"""Nghiệp vụ danh mục quyền (chỉ đọc; quyền được đồng bộ từ module registry)."""

from typing import Any

from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.services.core_crud_service import CoreCrudService
from app.iam.models.permission import Permission
from app.iam.repositories.permission_repository import PermissionRepository


class PermissionService(CoreCrudService[Permission, PermissionRepository]):
    """Đọc quyền đang hoạt động. Tạo/sửa/xóa quyền chỉ qua `sync_iam`."""

    repository_class = PermissionRepository

    def create(self, actor: Any, data: dict[str, Any]) -> Permission:
        """Không hỗ trợ.

        Args:
            actor: Người thực hiện.
            data: Dữ liệu.

        Raises:
            BusinessRuleError: Quyền do module khai báo, không tạo qua API.
        """
        raise BusinessRuleError("Quyền do module khai báo; dùng sync_iam.")

    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> Permission:
        """Không hỗ trợ.

        Args:
            actor: Người thực hiện.
            pk: Id quyền.
            data: Dữ liệu.

        Raises:
            BusinessRuleError: Quyền do module khai báo.
        """
        raise BusinessRuleError("Quyền do module khai báo; dùng sync_iam.")

    def delete(self, actor: Any, pk: Any) -> None:
        """Không hỗ trợ.

        Args:
            actor: Người thực hiện.
            pk: Id quyền.

        Raises:
            BusinessRuleError: Quyền do module khai báo.
        """
        raise BusinessRuleError("Quyền do module khai báo; dùng sync_iam.")
