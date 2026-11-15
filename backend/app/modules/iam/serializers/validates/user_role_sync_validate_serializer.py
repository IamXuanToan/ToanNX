"""Validate body PUT /iam/users/{id}/roles."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer

MAX_ROLES = 100


class UserRoleSyncValidateSerializer(CoreValidateSerializer):
    """Danh sách vai trò mong muốn của người dùng (thay toàn bộ)."""

    role_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=True,
        max_length=MAX_ROLES,
        help_text="Toàn bộ id vai trò người dùng cần có sau khi lưu (rỗng = gỡ hết).",
    )
