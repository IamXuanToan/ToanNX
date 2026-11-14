"""Validate sắp xếp block."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class PageBlockReorderValidateSerializer(CoreValidateSerializer):
    """Danh sách đầy đủ id block theo thứ tự mới."""

    block_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
        max_length=50,
        help_text="Toàn bộ id block chưa xóa của trang, theo thứ tự mới.",
    )
