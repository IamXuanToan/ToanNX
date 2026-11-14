"""Validate sửa trang tùy chỉnh."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.modules.custom_pages.models.page import Page


class PageUpdateValidateSerializer(CoreValidateSerializer):
    """Các trường được phép sửa của trang."""

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
    theme = serializers.JSONField(required=False, help_text="Theme cơ bản.")
    avatar_id = serializers.UUIDField(
        required=False, allow_null=True, help_text="Id attachment ảnh đại diện; null để gỡ."
    )
    cover_id = serializers.UUIDField(
        required=False, allow_null=True, help_text="Id attachment ảnh bìa; null để gỡ."
    )
