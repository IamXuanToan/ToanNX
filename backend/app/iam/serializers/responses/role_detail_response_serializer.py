"""Response GET/PATCH /iam/roles/{id}, POST /iam/roles, POST /iam/roles/{id}/permissions."""

from typing import Any

from rest_framework import serializers

from app.iam.models.role import Role
from app.iam.serializers.responses.permission_list_response_serializer import (
    PermissionListResponseSerializer,
)
from app.iam.serializers.responses.role_list_response_serializer import (
    RoleListResponseSerializer,
)


class RoleDetailResponseSerializer(RoleListResponseSerializer):
    """Chi tiết vai trò kèm danh sách quyền đang hoạt động."""

    permissions = serializers.SerializerMethodField(help_text="Các quyền đang hoạt động của vai trò.")

    class Meta(RoleListResponseSerializer.Meta):
        fields = (*RoleListResponseSerializer.Meta.fields, "permissions")

    def get_permissions(self, obj: Role) -> list[dict[str, Any]]:
        """Quyền của vai trò (đã prefetch ở repository).

        Args:
            obj: Vai trò.

        Returns:
            Danh sách quyền.
        """
        return [
            PermissionListResponseSerializer(item.permission).data
            for item in obj.role_permissions.all()
            if item.permission.is_active
        ]
