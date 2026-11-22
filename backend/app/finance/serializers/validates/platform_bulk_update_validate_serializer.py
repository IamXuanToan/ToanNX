"""Validate body POST bulk-update của Platform."""

from rest_framework import serializers

from app.core.serializers.core_bulk_ids_validate_serializer import CoreBulkIdsValidateSerializer


class PlatformBulkUpdateValidateSerializer(CoreBulkIdsValidateSerializer):
    """Cập nhật cờ `is_active` của nhiều bản ghi cùng lúc."""

    is_active = serializers.BooleanField(help_text="Bật/tắt nền tảng.")
