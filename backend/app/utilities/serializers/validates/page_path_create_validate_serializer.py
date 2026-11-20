"""Validate POST /utilities/page-paths."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class PagePathCreateValidateSerializer(CoreValidateSerializer):
    """Segment (1–32), tên, mô tả, bật, thứ tự."""

    segment = serializers.CharField(max_length=32, help_text="Đoạn URL giữa, ví dụ `qr`.")
    name = serializers.CharField(max_length=100, help_text="Tên hiển thị.")
    description = serializers.CharField(required=False, allow_blank=True, max_length=300, help_text="Mô tả.")
    is_active = serializers.BooleanField(required=False, help_text="Cho phép tạo trang mới vào đây.")
    position = serializers.IntegerField(required=False, min_value=0, max_value=32767, help_text="Thứ tự.")
