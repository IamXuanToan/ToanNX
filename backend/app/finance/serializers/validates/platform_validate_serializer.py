"""Tạo nền tảng."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class PlatformValidateSerializer(CoreValidateSerializer):
    """Tên, mã, tiền tệ mặc định."""

    name = serializers.CharField(max_length=150, help_text="Tên.")
    code = serializers.SlugField(max_length=50, help_text="Mã ngắn.")
    default_currency_id = serializers.UUIDField(help_text="Tiền tệ mặc định.")
    is_active = serializers.BooleanField(required=False, default=True, help_text="Đang dùng.")
    note = serializers.CharField(required=False, allow_blank=True, default="", help_text="Ghi chú.")
