"""Serializer xác thực payload tạo mới cấu hình hệ thống."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class SettingCreateValidateSerializer(CoreValidateSerializer):
    """Payload tạo mới cấu hình hệ thống."""

    key = serializers.CharField(
        max_length=100,
        required=True,
        help_text="Khóa cấu hình định danh (chữ thường, gạch dưới).",
    )
    value = serializers.JSONField(
        required=True,
        help_text="Giá trị cấu hình (bất kỳ kiểu JSON hợp lệ: boolean, số, chuỗi, dict, list).",
    )
    description = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
        default="",
        help_text="Mô tả ý nghĩa của cấu hình.",
    )
    category = serializers.CharField(
        max_length=50,
        required=False,
        default="general",
        help_text="Nhóm phân loại cấu hình (vd: general, auth, storage).",
    )
    is_public = serializers.BooleanField(
        required=False,
        default=False,
        help_text="Cho phép client chưa đăng nhập đọc cấu hình này.",
    )

    def validate_key(self, value: str) -> str:
        """Chuẩn hóa khóa cấu hình thành chữ thường."""
        return value.strip().lower()
