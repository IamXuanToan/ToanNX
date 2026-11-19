"""Validate cập nhật chương truyện."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class ChapterUpdateValidateSerializer(CoreValidateSerializer):
    """Input cập nhật chương truyện."""

    chapter_number = serializers.IntegerField(required=False, min_value=1, help_text="Số thứ tự chương.")
    title = serializers.CharField(required=False, max_length=255, help_text="Tiêu đề chương.")
    slug = serializers.CharField(required=False, max_length=255, help_text="Slug của chương.")
    content = serializers.CharField(required=False, help_text="Nội dung văn bản chương.")
    thumbnail_id = serializers.UUIDField(
        required=False, allow_null=True, help_text="Mã ảnh minh họa chương (UUID)."
    )
    is_published = serializers.BooleanField(required=False, help_text="Cho phép xuất bản chương.")
