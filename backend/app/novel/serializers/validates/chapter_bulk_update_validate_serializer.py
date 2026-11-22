"""Validate body POST bulk-update của Chapter."""

from rest_framework import serializers

from app.core.serializers.core_bulk_ids_validate_serializer import CoreBulkIdsValidateSerializer


class ChapterBulkUpdateValidateSerializer(CoreBulkIdsValidateSerializer):
    """Cập nhật cờ `is_published` của nhiều bản ghi cùng lúc."""

    is_published = serializers.BooleanField(help_text="Xuất bản / ẩn chương.")
