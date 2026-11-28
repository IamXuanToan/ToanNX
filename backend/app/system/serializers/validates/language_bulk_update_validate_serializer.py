"""Validate bật/tắt hàng loạt Language."""

from rest_framework import serializers

from app.core.serializers.core_bulk_ids_validate_serializer import CoreBulkIdsValidateSerializer


class LanguageBulkUpdateValidateSerializer(CoreBulkIdsValidateSerializer):
    """Cập nhật trạng thái bật/tắt hàng loạt ngôn ngữ."""

    is_active = serializers.BooleanField()
