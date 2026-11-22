"""Validate body POST /novel/novels/bulk-update."""

from rest_framework import serializers

from app.core.serializers.core_bulk_ids_validate_serializer import CoreBulkIdsValidateSerializer
from app.novel.models.novel import NovelStatus


class NovelBulkUpdateValidateSerializer(CoreBulkIdsValidateSerializer):
    """Cập nhật trạng thái hoặc xuất bản nhiều truyện cùng lúc."""

    status = serializers.ChoiceField(
        choices=NovelStatus.choices, required=False, help_text="Trạng thái truyện."
    )
    is_published = serializers.BooleanField(required=False, help_text="Cờ xuất bản truyện.")
