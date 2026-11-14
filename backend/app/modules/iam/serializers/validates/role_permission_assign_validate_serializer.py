"""Validate body POST /iam/roles/{id}/permissions."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class RolePermissionAssignValidateSerializer(CoreValidateSerializer):
    """Quyền cần gán."""

    permission_id = serializers.UUIDField(help_text="Id quyền cần gán (lấy từ /iam/permissions).")
