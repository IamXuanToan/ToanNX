"""Validate bật/tắt hàng loạt Mục tiêu giám sát Uptime."""

from rest_framework import serializers

from app.core.serializers.core_bulk_ids_validate_serializer import CoreBulkIdsValidateSerializer


class MonitorTargetBulkUpdateValidateSerializer(CoreBulkIdsValidateSerializer):
    """Bật/tắt nhiều mục tiêu giám sát cùng lúc."""

    is_active = serializers.BooleanField(help_text="Trạng thái bật giám sát mới (`true`/`false`).")
