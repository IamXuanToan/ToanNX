"""Response kết quả import truyện."""

from typing import Any

from rest_framework import serializers


class NovelImportResultResponseSerializer(serializers.Serializer[Any]):
    """Kết quả sau khi import truyện thành công."""

    novel_id = serializers.UUIDField(help_text="Mã truyện vừa tạo.")
    novel_title = serializers.CharField(help_text="Tên truyện vừa tạo.")
    novel_slug = serializers.CharField(help_text="Slug truyện vừa tạo.")
    chapters_count = serializers.IntegerField(help_text="Số chương đã import thành công.")
