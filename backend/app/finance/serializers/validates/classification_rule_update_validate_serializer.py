"""Sửa quy tắc nhận diện."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class ClassificationRuleUpdateValidateSerializer(CoreValidateSerializer):
    """Mọi field tùy chọn."""

    name = serializers.CharField(max_length=150, required=False, help_text="Tên.")
    platform_id = serializers.UUIDField(required=False, help_text="Nền tảng.")
    pattern = serializers.CharField(max_length=500, required=False, help_text="Regex.")
    priority = serializers.IntegerField(required=False, help_text="Ưu tiên.")
    is_active = serializers.BooleanField(required=False, help_text="Đang bật.")
