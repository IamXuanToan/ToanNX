"""Validate dữ liệu import truyện từ file template."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.novel.serializers.validates.novel_chapter_import_item_serializer import (
    NovelChapterImportItemSerializer,
)
from app.novel.serializers.validates.novel_info_import_serializer import NovelInfoImportSerializer


class NovelImportValidateSerializer(CoreValidateSerializer):
    """Toàn bộ cấu trúc JSON gói import."""

    format_version = serializers.CharField(required=False, default="1.0", help_text="Phiên bản mẫu.")
    novel = NovelInfoImportSerializer(help_text="Thông tin chi tiết truyện.")
    chapters = NovelChapterImportItemSerializer(many=True, help_text="Danh sách các chương truyện.")
