"""Kiểu dáng mã QR."""

from typing import Any

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.utilities.utils.qr_image_renderer import DEFAULT_STYLE

_HEX = r"^#[0-9A-Fa-f]{6}$"


class QrStyleValidateSerializer(CoreValidateSerializer):
    """Kích thước, màu, lề, mức sửa lỗi; trường trống dùng mặc định."""

    size = serializers.IntegerField(required=False, min_value=128, max_value=1024, help_text="Cạnh ảnh (px).")
    foreground = serializers.RegexField(_HEX, required=False, help_text="Màu mã `#RRGGBB`.")
    background = serializers.RegexField(_HEX, required=False, help_text="Màu nền `#RRGGBB`.")
    margin = serializers.IntegerField(required=False, min_value=0, max_value=8, help_text="Lề (số ô).")
    error_correction = serializers.ChoiceField(
        required=False, choices=["L", "M", "Q", "H"], help_text="Mức sửa lỗi."
    )

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        """Gộp với kiểu mặc định; màu chuẩn hóa in hoa."""
        merged = {**DEFAULT_STYLE, **attrs}
        merged["foreground"] = merged["foreground"].upper()
        merged["background"] = merged["background"].upper()
        return merged
