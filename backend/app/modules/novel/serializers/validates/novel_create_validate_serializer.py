"""Validate tạo truyện mới."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.modules.novel.models.novel import NovelStatus


class NovelCreateValidateSerializer(CoreValidateSerializer):
    """Input tạo truyện."""

    title = serializers.CharField(max_length=255, help_text="Tiêu đề truyện.")
    slug = serializers.CharField(
        required=False, max_length=255, help_text="Slug tùy chọn; để trống sẽ tự sinh từ tiêu đề."
    )
    original_title = serializers.CharField(
        required=False, allow_blank=True, max_length=255, help_text="Tên gốc của truyện."
    )
    author_id = serializers.UUIDField(
        required=False, allow_null=True, help_text="Mã định danh tác giả (UUID)."
    )
    thumbnail_id = serializers.UUIDField(
        required=False, allow_null=True, help_text="Mã định danh ảnh bìa Attachment (UUID)."
    )
    description = serializers.CharField(
        required=False, allow_blank=True, help_text="Tóm tắt giới thiệu truyện."
    )
    status = serializers.ChoiceField(
        required=False,
        choices=NovelStatus.choices,
        default=NovelStatus.ONGOING,
        help_text="Trạng thái truyện.",
    )
    genre_ids = serializers.ListField(
        child=serializers.UUIDField(), required=False, help_text="Danh sách UUID thể loại."
    )
    tag_ids = serializers.ListField(
        child=serializers.UUIDField(), required=False, help_text="Danh sách UUID thẻ."
    )
    is_published = serializers.BooleanField(
        required=False, default=True, help_text="Cho phép xuất bản truyện."
    )
