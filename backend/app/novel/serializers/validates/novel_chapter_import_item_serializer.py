"""Validate một chương trong gói import truyện."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class NovelChapterImportItemSerializer(CoreValidateSerializer):
    """Thông tin chương trong gói import."""

    chapter_number = serializers.IntegerField(required=False, help_text="Số chương.")
    title = serializers.CharField(max_length=255, help_text="Tiêu đề chương.")
    slug = serializers.CharField(required=False, max_length=255, help_text="Slug của chương.")
    content = serializers.CharField(max_length=200_000, help_text="Nội dung chương.")
    word_count = serializers.IntegerField(required=False, help_text="Số từ (tùy chọn).")
    is_published = serializers.BooleanField(required=False, default=True, help_text="Xuất bản.")
