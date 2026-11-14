"""Kiểm tra theme và nội dung block có cấu trúc."""

import re
from typing import Any

from app.core.exceptions.validation_error import ValidationError
from app.core.utils.url import validate_public_url
from app.modules.custom_pages.models.page_block import PageBlock

_HTML_TAG = re.compile(r"<\s*/?\s*[a-zA-Z][^>]*>")
_HEX_COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")


def _plain(value: Any, *, limit: int, field: str) -> str:
    """Nhận văn bản thuần với giới hạn byte, từ chối HTML."""
    if (
        not isinstance(value, str)
        or not value.strip()
        or len(value.encode("utf-8")) > limit
        or _HTML_TAG.search(value)
    ):
        raise ValidationError(details={field: ["Cần văn bản thuần hợp lệ."]})
    return value.strip()


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


def validate_block_content(block_type: str, value: Any) -> dict[str, Any]:
    """Kiểm tra trường riêng của mỗi loại block, từ chối HTML và field lạ."""
    if not isinstance(value, dict):
        raise ValidationError(details={"content": ["Nội dung phải là object."]})
    if block_type == PageBlock.Type.HEADING:
        _keys(value, {"text", "level"})
        if type(value.get("level")) is not int or value["level"] not in (1, 2, 3):
            raise ValidationError(details={"content.level": ["Cấp tiêu đề phải là 1, 2 hoặc 3."]})
        return {"text": _plain(value.get("text"), limit=300, field="content.text"), "level": value["level"]}
    if block_type == PageBlock.Type.TEXT:
        _keys(value, {"text"})
        return {"text": _plain(value.get("text"), limit=5000, field="content.text")}
    if block_type == PageBlock.Type.IMAGE:
        _keys(value, {"attachment_id", "alt"})
        return {
            "attachment_id": _uuid(value.get("attachment_id")),
            "alt": _plain(value.get("alt"), limit=200, field="content.alt"),
        }
    if block_type == PageBlock.Type.BUTTON:
        _keys(value, {"label", "url"})
        return {
            "label": _plain(value.get("label"), limit=120, field="content.label"),
            "url": validate_public_url(value.get("url", ""), "content.url"),
        }
    if block_type == PageBlock.Type.LINK_LIST:
        _keys(value, {"items"})
        return {"items": _items(value.get("items"), label_key="label", maximum=20)}
    if block_type == PageBlock.Type.SOCIAL_LINKS:
        _keys(value, {"items"})
        return {"items": _items(value.get("items"), label_key="platform", maximum=12)}
    if block_type == PageBlock.Type.DIVIDER:
        _keys(value, set())
        return {}
    if block_type == PageBlock.Type.QR_CODE:
        if value.get("target_type") == "PAGE":
            _keys(value, {"target_type", "label"})
            return {
                "target_type": "PAGE",
                "label": _plain(value.get("label"), limit=120, field="content.label"),
            }
        if value.get("target_type") == "URL":
            _keys(value, {"target_type", "target_url", "label"})
            return {
                "target_type": "URL",
                "target_url": validate_public_url(value.get("target_url", ""), "content.target_url"),
                "label": _plain(value.get("label"), limit=120, field="content.label"),
            }
        raise ValidationError(details={"content.target_type": ["Chỉ PAGE hoặc URL."]})
    raise ValidationError(details={"block_type": ["Loại block không được hỗ trợ."]})


def _keys(value: dict[str, Any], expected: set[str]) -> None:
    """Bắt buộc đúng tập trường cho một block."""
    if set(value) != expected:
        raise ValidationError(details={"content": ["Thiếu trường hoặc có trường không được hỗ trợ."]})


def _uuid(value: Any) -> str:
    """Chuẩn hóa UUID từ JSON."""
    from uuid import UUID  # noqa: PLC0415

    try:
        return str(UUID(str(value)))
    except (ValueError, TypeError) as exc:
        raise ValidationError(details={"content.attachment_id": ["Id file không hợp lệ."]}) from exc


def _items(value: Any, *, label_key: str, maximum: int) -> list[dict[str, str]]:
    """Kiểm tra danh sách liên kết có giới hạn phần tử."""
    if not isinstance(value, list) or not 1 <= len(value) <= maximum:
        raise ValidationError(details={"content.items": ["Số mục không hợp lệ."]})
    result = []
    for item in value:
        if not isinstance(item, dict):
            raise ValidationError(details={"content.items": ["Mỗi mục phải là object."]})
        _keys(item, {label_key, "url"})
        result.append(
            {
                label_key: _plain(item.get(label_key), limit=100, field=f"content.{label_key}"),
                "url": validate_public_url(item.get("url", ""), "content.url"),
            }
        )
    return result
