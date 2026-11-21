"""Serializer xác thực payload cập nhật cấu hình hệ thống."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class SettingUpdateValidateSerializer(CoreValidateSerializer):
    """Payload cập nhật cấu hình hệ thống (mọi field tùy chọn)."""

    value = serializers.JSONField(
        required=False,
        help_text="Giá trị mới của cấu hình.",
    )
    description = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
        help_text="Mô tả ý nghĩa của cấu hình.",
    )
    category = serializers.CharField(
        max_length=50,
        required=False,
        help_text="Nhóm phân loại cấu hình.",
    )
    is_public = serializers.BooleanField(
        required=False,
        help_text="Cờ công khai của cấu hình.",
    )
