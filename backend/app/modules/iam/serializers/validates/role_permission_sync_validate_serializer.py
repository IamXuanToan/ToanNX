"""Validate body PUT /iam/roles/{id}/permissions."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer

MAX_PERMISSIONS = 500


class RolePermissionSyncValidateSerializer(CoreValidateSerializer):
    """Danh sách quyền mong muốn của vai trò (thay toàn bộ)."""

    permission_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=True,
        max_length=MAX_PERMISSIONS,
        help_text="Toàn bộ id quyền vai trò cần có sau khi lưu (rỗng = gỡ hết).",
    )
