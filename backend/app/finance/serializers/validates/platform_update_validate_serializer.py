"""Sửa nền tảng."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class PlatformUpdateValidateSerializer(CoreValidateSerializer):
    """Mọi field tùy chọn."""

    name = serializers.CharField(max_length=150, required=False, help_text="Tên.")
    code = serializers.SlugField(max_length=50, required=False, help_text="Mã ngắn.")
    default_currency_id = serializers.UUIDField(required=False, help_text="Tiền tệ mặc định.")
    color = serializers.RegexField(
        r"^(#[0-9A-Fa-f]{6})?$",
        required=False,
        allow_blank=True,
        help_text="Mã màu HEX (#RRGGBB).",
    )
    is_active = serializers.BooleanField(required=False, help_text="Đang dùng.")
    note = serializers.CharField(required=False, allow_blank=True, help_text="Ghi chú.")

    def validate_color(self, value: str) -> str:
        """Chuẩn hóa mã màu HEX viết hoa."""
        return value.strip().upper()
