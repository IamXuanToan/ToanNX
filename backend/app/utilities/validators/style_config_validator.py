"""Kiểm tra `style_config` của trang (chỉ nhận cấu hình có cấu trúc, không nhận CSS/JS tùy ý)."""

import re
from typing import Any

from app.core.exceptions.validation_error import ValidationError

_HEX_COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")
_PRESET_KEY = re.compile(r"^[a-zA-Z0-9_-]{1,64}$")
_CAMEL_BOUNDARY = re.compile(r"(?<!^)(?=[A-Z])")

_ENUM_OPTIONS: dict[str, set[str]] = {
    "background_type": {"solid", "gradient", "image", "pattern"},
    "gradient_type": {"linear", "radial"},
    "pattern_key": {
        "dots",
        "grid",
        "mesh",
        "diagonal",
        "aura",
        "top_spotlight",
        "bottom_glow",
        "grid_fade",
        "dot_fade",
        "dashed_grid",
        "isometric",
        "checker_soft",
        "crosshatch",
        "concentric",
        "sunset_horizon",
        "cyber_horizon",
        "aurora_beams",
        "blueprint",
        "paper_grain",
        "duotone_corner",
    },
    "background_fit": {"cover", "contain", "tile"},
    "ambient_motion": {"none", "gradient_flow", "floating_orbs"},
    "header_layout": {"centered", "banner_overlap", "hero_card", "editorial_left"},
    "avatar_shape": {"circle", "squircle", "square"},
    "avatar_size": {"sm", "md", "lg"},
    "avatar_ring": {"none", "solid", "gradient_glow"},
    "cover_height": {"sm", "md", "lg"},
    "social_position": {"top", "bottom", "hidden"},
    "social_style": {"pill", "circle_outline", "minimal"},
    "surface_style": {"solid", "outline", "soft", "glass", "elevated", "hard_shadow"},
    "card_radius": {"0px", "4px", "8px", "12px", "20px"},
    "card_shadow": {"none", "sm", "md", "lg"},
    "hover_effect": {"none", "lift", "scale", "glow", "shine", "hard_push"},
    "entrance_animation": {"none", "fade_up", "scale_in", "blur_in"},
    "highlight_effect": {"none", "pulse_ring", "wiggle", "shimmer"},
    "link_layout": {
        "classic_bar",
        "thumbnail_card",
        "featured_hero",
        "grid_2col",
        "bento_grid",
        "compact_pills",
    },
    "button_text_align": {"left", "center"},
    "layout": {"grid", "list", "links", "carousel_featured"},
    "card_density": {"compact", "standard", "detailed"},
    "image_aspect_ratio": {"1:1", "4:3", "16:9", "4:5"},
    "cta_style": {"full_button", "icon_circle", "inline_arrow"},
    "qr_card_style": {"fintech_glass", "split_modern", "minimal_card"},
    "preset_button_style": {"gift_cards", "pill_tags", "compact_grid"},
    "leaderboard_style": {"podium", "list", "hidden"},
    "font_family": {"inter", "plus_jakarta", "be_vietnam", "playfair", "jetbrains_mono"},
    "container_width": {"compact", "standard", "wide"},
    "block_spacing": {"compact", "normal", "relaxed"},
    "footer_style": {"minimal", "pill", "hidden"},
}

_COLOR_KEYS = {"primary_color", "background_color", "text_color", "overlay_color"}

_INT_RANGES: dict[str, tuple[int, int]] = {
    "gradient_angle": (0, 360),
    "background_blur": (0, 24),
    "overlay_opacity": (0, 85),
}

_BOOL_KEYS = {
    "show_verified_badge",
    "cover_fade",
    "show_share_button",
    "show_search",
    "show_price",
    "show_image",
    "show_discount_badge",
    "show_platform_badge",
    "sticky_filter_bar",
}

_ALLOWED_KEYS = (
    set(_ENUM_OPTIONS)
    | _COLOR_KEYS
    | set(_INT_RANGES)
    | _BOOL_KEYS
    | {"theme_preset", "gradient_colors", "status_pill"}
)


_CARD_RADIUS_ALIASES: dict[str, str] = {
    "rounded": "12px",
    "pill": "20px",
    "square": "0px",
}


def _to_snake_key(key: str) -> str:
    return _CAMEL_BOUNDARY.sub("_", key).lower()


def _validate_enum(key: str, raw: Any, options: set[str]) -> str:
    if not isinstance(raw, str) or raw not in options:
        raise ValidationError(details={"style_config": [f"{key} không hợp lệ."]})
    return raw


def _validate_color(key: str, raw: Any) -> str:
    if not isinstance(raw, str) or not _HEX_COLOR.fullmatch(raw.strip()):
        raise ValidationError(details={"style_config": [f"{key} phải là màu #RRGGBB."]})
    return raw.strip().lower()


def _validate_int_range(key: str, raw: Any, min_val: int, max_val: int) -> int:
    if isinstance(raw, bool) or not isinstance(raw, (int, float)):
        raise ValidationError(details={"style_config": [f"{key} phải là số nguyên."]})
    num = int(raw)
    if num < min_val or num > max_val:
        raise ValidationError(
            details={"style_config": [f"{key} phải nằm trong khoảng {min_val}..{max_val}."]}
        )
    return num


def _validate_gradient_colors(raw: Any) -> list[str]:
    if not isinstance(raw, list) or not (2 <= len(raw) <= 3):
        raise ValidationError(details={"style_config": ["gradient_colors phải gồm 2 đến 3 mã màu #RRGGBB."]})
    colors: list[str] = []
    for item in raw:
        colors.append(_validate_color("gradient_colors", item))
    return colors


def validate_style_config(value: Any) -> dict[str, Any]:
    """Chuẩn hóa key về snake_case và kiểm tra toàn bộ token `style_config`."""
    if value is None:
        return {}
    if not isinstance(value, dict):
        raise ValidationError(details={"style_config": ["Cấu hình giao diện phải là object JSON."]})

    result: dict[str, Any] = {}
    for raw_key, raw_val in value.items():
        if not isinstance(raw_key, str):
            raise ValidationError(details={"style_config": ["Tên khóa cấu hình không hợp lệ."]})
        key = _to_snake_key(raw_key)
        if key not in _ALLOWED_KEYS:
            raise ValidationError(details={"style_config": [f"Không hỗ trợ khóa cấu hình `{key}`."]})
        if raw_val is None or raw_val == "":
            continue

        if key in _ENUM_OPTIONS:
            normalized_val = (
                _CARD_RADIUS_ALIASES.get(raw_val, raw_val)
                if key == "card_radius" and isinstance(raw_val, str)
                else raw_val
            )
            result[key] = _validate_enum(key, normalized_val, _ENUM_OPTIONS[key])
        elif key in _COLOR_KEYS:
            result[key] = _validate_color(key, raw_val)
        elif key in _INT_RANGES:
            lo, hi = _INT_RANGES[key]
            result[key] = _validate_int_range(key, raw_val, lo, hi)
        elif key in _BOOL_KEYS:
            if not isinstance(raw_val, bool):
                raise ValidationError(details={"style_config": [f"{key} phải là boolean."]})
            result[key] = raw_val
        elif key == "theme_preset":
            if not isinstance(raw_val, str) or not _PRESET_KEY.fullmatch(raw_val):
                raise ValidationError(details={"style_config": ["theme_preset không hợp lệ."]})
            result[key] = raw_val
        elif key == "gradient_colors":
            result[key] = _validate_gradient_colors(raw_val)
        elif key == "status_pill":
            if not isinstance(raw_val, str) or len(raw_val.strip()) > 60:
                raise ValidationError(details={"style_config": ["status_pill tối đa 60 ký tự."]})
            cleaned = raw_val.strip()
            if cleaned:
                result[key] = cleaned

    return result
