"""Tạo quy tắc nhận diện."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class ClassificationRuleValidateSerializer(CoreValidateSerializer):
    """Tên, nền tảng, regex, ưu tiên."""

    name = serializers.CharField(max_length=150, help_text="Tên.")
    platform_id = serializers.UUIDField(help_text="Nền tảng.")
    pattern = serializers.CharField(max_length=500, help_text="Regex.")
    priority = serializers.IntegerField(required=False, default=100, help_text="Ưu tiên (lớn thắng).")
    is_active = serializers.BooleanField(required=False, default=True, help_text="Đang bật.")
