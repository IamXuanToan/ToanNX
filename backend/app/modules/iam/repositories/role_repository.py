"""Repository vai trò (đọc + ghi)."""

from typing import Any

from django.db.models import Count, QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.modules.iam.models.role import Role
from app.modules.iam.models.role_auto_grant import RoleAutoGrant


class RoleRepository(CoreRepository[Role]):
    """Truy cập dữ liệu vai trò."""

    model = Role
    default_ordering = ("-created_at", "-pk")
    ordering_fields = frozenset({"code", "name", "created_at"})

    def get_queryset(self) -> QuerySet[Role]:
        """Vai trò chưa xóa mềm, kèm số quyền và số người dùng.

        Returns:
            QuerySet.
        """
        return (
            super()
            .get_queryset()
            .annotate(
                permission_count=Count("role_permissions", distinct=True),
                user_count=Count("user_roles", distinct=True),
            )
        )

    def get_detail(self, pk: Any) -> Role:
        """Chi tiết vai trò kèm danh sách quyền.

        Args:
            pk: Id vai trò.

        Returns:
            Vai trò.
        """
        role = self.get_by_id(pk)
        return self.get_queryset().prefetch_related("role_permissions__permission").get(pk=role.pk)

    def list_auto_grant(self) -> list[Role]:
        """Vai trò có chính sách tự cấp quyền (đọc từ cấu hình trong DB).

        Returns:
            Danh sách vai trò.
        """
        return list(Role.objects.alive().exclude(auto_grant=RoleAutoGrant.NONE))

    def list_for_user(self, user_id: Any) -> list[Role]:
        """Vai trò đang gán cho người dùng (chưa xóa mềm), sắp theo tên.

        Args:
            user_id: Id người dùng.

        Returns:
            Danh sách vai trò.
        """
        return list(Role.objects.alive().filter(user_roles__user_id=user_id).order_by("-created_at", "-pk"))
