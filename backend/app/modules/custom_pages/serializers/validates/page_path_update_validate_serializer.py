"""Validate PATCH /custom_pages/paths/{id}."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class PagePathUpdateValidateSerializer(CoreValidateSerializer):
    """Mọi trường tùy chọn; đổi segment làm URL cũ 404."""

    segment = serializers.CharField(required=False, max_length=32, help_text="Đoạn URL giữa.")
    name = serializers.CharField(required=False, max_length=100, help_text="Tên hiển thị.")
    description = serializers.CharField(required=False, allow_blank=True, max_length=300, help_text="Mô tả.")
    is_active = serializers.BooleanField(required=False, help_text="Cho phép tạo trang mới vào đây.")
    position = serializers.IntegerField(required=False, min_value=0, max_value=32767, help_text="Thứ tự.")
