"""Validate tạo chương mới."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class ChapterCreateValidateSerializer(CoreValidateSerializer):
    """Input tạo chương truyện mới."""

    novel_id = serializers.UUIDField(help_text="Mã định danh bộ truyện (UUID).")
    chapter_number = serializers.IntegerField(min_value=1, help_text="Số thứ tự chương (1, 2, 3...).")
    title = serializers.CharField(max_length=255, help_text="Tiêu đề chương.")
    slug = serializers.CharField(required=False, max_length=255, help_text="Slug của chương (tùy chọn).")
    content = serializers.CharField(help_text="Nội dung văn bản của chương.")
    thumbnail_id = serializers.UUIDField(
        required=False, allow_null=True, help_text="Mã ảnh minh họa chương (UUID)."
    )
    is_published = serializers.BooleanField(
        required=False, default=True, help_text="Cho phép xuất bản chương."
    )
