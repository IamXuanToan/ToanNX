"""Response template mẫu import truyện."""

from typing import Any

from rest_framework import serializers


class NovelImportTemplateResponseSerializer(serializers.Serializer[Any]):
    """Cấu trúc template mẫu import truyện."""

    format_version = serializers.CharField(help_text="Phiên bản định dạng.")
    novel = serializers.DictField(help_text="Dữ liệu mẫu của truyện.")
    chapters = serializers.ListField(child=serializers.DictField(), help_text="Danh sách chương mẫu.")
