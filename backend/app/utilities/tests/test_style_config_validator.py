"""Unit test cho validator `style_config` của Custom Page."""

import pytest

from app.core.exceptions.validation_error import ValidationError
from app.utilities.validators.style_config_validator import validate_style_config


def test_validate_style_config_accepts_full_options_and_normalizes_camel_case() -> None:
    """Chấp nhận đủ các nhóm tùy chọn mới + key cũ và chuẩn hóa về snake_case."""
    result = validate_style_config(
        {
            "themePreset": "aurora_glass",
            "primaryColor": "#4F46E5",
            "backgroundType": "gradient",
            "gradientType": "linear",
            "gradientAngle": 135,
            "gradientColors": ["#0f172a", "#312e81", "#4f46e5"],
            "patternKey": "grid_fade",
            "backgroundFit": "cover",
            "backgroundBlur": 12,
            "overlayColor": "#000000",
            "overlayOpacity": 40,
            "ambientMotion": "floating_orbs",
            "headerLayout": "banner_overlap",
            "avatarShape": "squircle",
            "avatarSize": "lg",
            "avatarRing": "gradient_glow",
            "showVerifiedBadge": True,
            "statusPill": "  Đang nhận booking  ",
            "coverHeight": "md",
            "coverFade": True,
            "socialPosition": "top",
            "socialStyle": "pill",
            "showShareButton": True,
            "surfaceStyle": "glass",
            "cardRadius": "20px",
            "cardShadow": "md",
            "hoverEffect": "shine",
            "entranceAnimation": "fade_up",
            "highlightEffect": "pulse_ring",
            "linkLayout": "bento_grid",
            "buttonTextAlign": "left",
            "layout": "carousel_featured",
            "cardDensity": "detailed",
            "imageAspectRatio": "4:5",
            "ctaStyle": "full_button",
            "showSearch": True,
            "showPrice": True,
            "showImage": True,
            "showDiscountBadge": True,
            "showPlatformBadge": True,
            "stickyFilterBar": True,
            "qrCardStyle": "fintech_glass",
            "presetButtonStyle": "gift_cards",
            "leaderboardStyle": "podium",
            "fontFamily": "plus_jakarta",
            "containerWidth": "compact",
            "blockSpacing": "relaxed",
            "footerStyle": "pill",
        }
    )

    assert result["background_type"] == "gradient"
    assert result["primary_color"] == "#4f46e5"
    assert result["gradient_colors"] == ["#0f172a", "#312e81", "#4f46e5"]
    assert result["status_pill"] == "Đang nhận booking"
    assert result["surface_style"] == "glass"
    assert result["hover_effect"] == "shine"
    assert result["link_layout"] == "bento_grid"
    assert result["font_family"] == "plus_jakarta"


def test_validate_style_config_normalizes_legacy_card_radius() -> None:
    """Chuẩn hóa giá trị `card_radius` cũ (`rounded`/`pill`/`square`) sang px."""
    assert validate_style_config({"cardRadius": "rounded"})["card_radius"] == "12px"
    assert validate_style_config({"card_radius": "pill"})["card_radius"] == "20px"
    assert validate_style_config({"card_radius": "square"})["card_radius"] == "0px"


@pytest.mark.parametrize(
    "payload",
    [
        {"customCss": "body { color: red }"},
        {"surfaceStyle": "script_inject"},
        {"overlayOpacity": 95},
        {"backgroundBlur": 40},
        {"gradientColors": ["#ffffff"]},
        {"gradientColors": ["not-a-color", "#000000"]},
        {"statusPill": "x" * 61},
        {"showDiscountBadge": "yes"},
    ],
)
def test_validate_style_config_rejects_invalid_values(payload: dict[str, object]) -> None:
    """Từ chối CSS thô, enum lạ, số vượt biên hoặc sai kiểu dữ liệu."""
    with pytest.raises(ValidationError):
        validate_style_config(payload)
