"""Repository quyền (đọc + ghi)."""

from collections.abc import Iterable
from typing import Any

from django.db.models import QuerySet

from app.core.registry.permission_definition import PermissionDefinition
from app.core.repositories.core_repository import CoreRepository
from app.system.models.permission import Permission


class PermissionRepository(CoreRepository[Permission]):
    """Truy cập dữ liệu quyền."""

    model = Permission

    def get_queryset(self) -> QuerySet[Permission]:
        """Chỉ quyền đang hoạt động.

        Returns:
            QuerySet.
        """
        return super().get_queryset().filter(is_active=True)

    def get_codes_for_user(self, user_id: Any) -> frozenset[str]:
        """Mã quyền hiệu lực từ các vai trò đang hoạt động của người dùng (một truy vấn).

        Args:
            user_id: Id người dùng.

        Returns:
            Tập mã quyền.
        """
        return frozenset(
            self.get_queryset()
            .filter(
                role_permissions__role__is_active=True,
                role_permissions__role__deleted_at__isnull=True,
                role_permissions__role__user_roles__user_id=user_id,
            )
            .values_list("code", flat=True)
            .distinct()
        )

    def get_codes_for_role(self, role_id: Any) -> set[str]:
        """Mã quyền đang hoạt động của vai trò.

        Args:
            role_id: Id vai trò.

        Returns:
            Tập mã quyền.
        """
        return set(self.values_list("code", role_permissions__role_id=role_id))

    def get_codes_for_roles(self, role_ids: Iterable[Any]) -> set[str]:
        """Mã quyền đang hoạt động của nhiều vai trò (một query).

        Args:
            role_ids: Id vai trò.

        Returns:
            Tập mã quyền.
        """
        return set(self.values_list("code", role_permissions__role_id__in=list(role_ids)))

    def upsert_definition(self, definition: PermissionDefinition) -> bool:
        """Tạo/cập nhật quyền theo khai báo của module.

        Args:
            definition: Định nghĩa quyền.

        Returns:
            True nếu tạo mới.
        """
        module, resource, action = definition.parts
        _, created = Permission.objects.update_or_create(
            code=definition.code,
            defaults={
                "module": module,
                "resource": resource,
                "action": action,
                "name": definition.name,
                "description": definition.description,
                "is_active": True,
            },
        )
        return created

    def deactivate_except(self, codes: Iterable[str]) -> int:
        """Vô hiệu các quyền không còn được khai báo (không xóa dữ liệu gán).

        Args:
            codes: Mã quyền còn khai báo.

        Returns:
            Số quyền bị vô hiệu.
        """
        return Permission.objects.filter(is_active=True).exclude(code__in=list(codes)).update(is_active=False)
