"""Validate PATCH /custom_pages/pages/{id}."""

from typing import Any

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.modules.custom_pages.models.page import Page


class PageUpdateValidateSerializer(CoreValidateSerializer):
    """Mọi trường tùy chọn; gửi `content` thì bắt buộc `content_version` đang có."""

    path_id = serializers.UUIDField(required=False, help_text="Đổi đường dẫn giữa (đích phải đang bật).")
    title = serializers.CharField(required=False, max_length=150, help_text="Tiêu đề trang.")
    slug = serializers.CharField(required=False, max_length=64, help_text="Slug mới; URL cũ trả 404.")
    description = serializers.CharField(required=False, allow_blank=True, max_length=1000, help_text="Mô tả.")
    status = serializers.ChoiceField(
        required=False, choices=Page.Status.choices, help_text="DRAFT, PUBLISHED hoặc UNPUBLISHED."
    )
    seo_title = serializers.CharField(
        required=False, allow_blank=True, max_length=160, help_text="Tiêu đề SEO."
    )
    seo_description = serializers.CharField(
        required=False, allow_blank=True, max_length=300, help_text="Mô tả SEO."
    )
    theme = serializers.JSONField(required=False, help_text="Theme.")
    avatar_id = serializers.UUIDField(required=False, allow_null=True, help_text="Ảnh đại diện; null để gỡ.")
    cover_id = serializers.UUIDField(required=False, allow_null=True, help_text="Ảnh bìa; null để gỡ.")
    content = serializers.JSONField(required=False, help_text="Tài liệu Tiptap JSON.")
    content_version = serializers.IntegerField(
        required=False, min_value=1, help_text="Phiên bản nội dung đang sửa; lệch → 409."
    )

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        """Bắt buộc `content_version` khi sửa nội dung."""
        if "content" in attrs and "content_version" not in attrs:
            raise serializers.ValidationError({"content_version": ["Bắt buộc khi sửa nội dung."]})
        return attrs
