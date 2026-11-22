"""Validate body POST bulk-update của Currency."""

from rest_framework import serializers

from app.core.serializers.core_bulk_ids_validate_serializer import CoreBulkIdsValidateSerializer


class CurrencyBulkUpdateValidateSerializer(CoreBulkIdsValidateSerializer):
    """Cập nhật cờ `is_active` của nhiều bản ghi cùng lúc."""

    is_active = serializers.BooleanField(help_text="Bật/tắt tiền tệ (tiền tệ gốc không tắt được).")
