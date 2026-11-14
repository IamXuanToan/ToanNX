"""Validate body POST /iam/users/{id}/roles."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class UserRoleAssignValidateSerializer(CoreValidateSerializer):
    """Vai trò cần gán."""

    role_id = serializers.UUIDField(help_text="Id vai trò cần gán (lấy từ /iam/roles).")
