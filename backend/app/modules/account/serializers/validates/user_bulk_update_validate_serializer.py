"""Validate body POST /account/users/bulk-update."""

from rest_framework import serializers

from app.core.serializers.core_bulk_ids_validate_serializer import CoreBulkIdsValidateSerializer


class UserBulkUpdateValidateSerializer(CoreBulkIdsValidateSerializer):
    """Khóa/mở nhiều tài khoản cùng lúc."""

    is_active = serializers.BooleanField(help_text="true = mở, false = khóa (thu hồi mọi phiên).")
