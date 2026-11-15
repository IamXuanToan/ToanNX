"""Kiểm tra theme của trang (token có cấu trúc, không nhận CSS/JS tùy ý)."""

import re
from typing import Any

from app.core.exceptions.validation_error import ValidationError

_HEX_COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")


def validate_theme(value: Any) -> dict[str, str]:
    """Chỉ lưu token theme được hỗ trợ và bảo đảm tương phản chữ/nền."""
    if not isinstance(value, dict) or not set(value) <= {
        "mode",
        "primary_color",
        "background_color",
        "text_color",
        "button_style",
    }:
        raise ValidationError(details={"theme": ["Cấu hình theme không hợp lệ."]})
    result: dict[str, str] = {}
    for key, options in {
        "mode": {"light", "dark", "system"},
        "button_style": {"rounded", "square", "pill"},
    }.items():
        if key in value:
            if not isinstance(value[key], str) or value[key] not in options:
                raise ValidationError(details={"theme": [f"{key} không hợp lệ."]})
            result[key] = value[key]
    for key in ("primary_color", "background_color", "text_color"):
        if key in value:
            if not isinstance(value[key], str) or not _HEX_COLOR.fullmatch(value[key]):
                raise ValidationError(details={"theme": [f"{key} phải là màu #RRGGBB."]})
            result[key] = value[key].lower()
    if (
        "background_color" in result
        and "text_color" in result
        and _contrast(result["background_color"], result["text_color"]) < 4.5
    ):
        raise ValidationError(details={"theme": ["Màu chữ và nền cần tương phản ít nhất 4.5:1."]})
    return result


def _contrast(first: str, second: str) -> float:
    """Tính độ tương phản WCAG từ hai màu hex."""

    def luminance(color: str) -> float:
        channels = [int(color[index : index + 2], 16) / 255 for index in (1, 3, 5)]
        linear = [
            channel / 12.92 if channel <= 0.04045 else ((channel + 0.055) / 1.055) ** 2.4
            for channel in channels
        ]
        return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722

    high, low = sorted((luminance(first), luminance(second)), reverse=True)
    return (high + 0.05) / (low + 0.05)
