"""Validate thông tin truyện trong gói import."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class NovelInfoImportSerializer(CoreValidateSerializer):
    """Thông tin truyện trong gói import."""

    title = serializers.CharField(max_length=255, help_text="Tiêu đề truyện.")
    slug = serializers.CharField(required=False, max_length=255, help_text="Slug của truyện.")
    original_title = serializers.CharField(
        required=False, allow_blank=True, max_length=255, help_text="Tên gốc."
    )
    author = serializers.CharField(required=False, allow_blank=True, help_text="Tên tác giả.")
    description = serializers.CharField(required=False, allow_blank=True, help_text="Giới thiệu.")
    status = serializers.CharField(required=False, default="ONGOING", help_text="Trạng thái.")
    genres = serializers.ListField(
        child=serializers.CharField(), required=False, help_text="Danh sách tên thể loại."
    )
    tags = serializers.ListField(
        child=serializers.CharField(), required=False, help_text="Danh sách tên thẻ / hashtag."
    )
    is_published = serializers.BooleanField(required=False, default=True, help_text="Xuất bản.")
