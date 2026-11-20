"""Vẽ mã QR ra PNG (lưu Thư viện) và SVG data URL (xem trước) bằng `segno`."""

import base64
import io
from typing import Any

import segno
from PIL import Image, ImageOps

from app.core.exceptions.validation_error import ValidationError

LOGO_MAX_PIXELS = 16_000_000
LOGO_MODULE_RATIO = 0.20
LOGO_MIN_MODULES = 5
LOGO_PADDING_RATIO = 0.10

DEFAULT_STYLE: dict[str, Any] = {
    "size": 512,
    "foreground": "#000000",
    "background": "#FFFFFF",
    "margin": 2,
    "error_correction": "M",
}


def _make(payload: str, style: dict[str, Any], *, has_logo: bool = False) -> tuple[Any, int, dict[str, Any]]:
    """Tạo symbol và tỉ lệ để ảnh gần đúng kích thước yêu cầu."""
    merged = {**DEFAULT_STYLE, **style}
    qr = segno.make(payload, error="h" if has_logo else merged["error_correction"].lower(), micro=False)
    width, _ = qr.symbol_size(scale=1, border=merged["margin"])
    scale = max(1, merged["size"] // width)
    return qr, scale, merged


def _logo_stamp(logo_bytes: bytes, qr: Any, scale: int, background: str) -> Image.Image:
    """Thu nhỏ ảnh logo vào nền đặc, giới hạn diện tích che mã QR."""
    modules, _ = qr.symbol_size(scale=1, border=0)
    side = max(LOGO_MIN_MODULES, int(modules * LOGO_MODULE_RATIO)) * scale
    padding = max(1, int(side * LOGO_PADDING_RATIO))
    try:
        with Image.open(io.BytesIO(logo_bytes)) as source:
            if source.width * source.height > LOGO_MAX_PIXELS:
                raise ValidationError(details={"logo_id": ["Ảnh logo quá lớn."]})
            logo = ImageOps.exif_transpose(source).convert("RGBA")
            logo.thumbnail((side - 2 * padding, side - 2 * padding), Image.Resampling.LANCZOS)
    except (OSError, Image.DecompressionBombError) as exc:
        raise ValidationError(details={"logo_id": ["Ảnh logo không đọc được."]}) from exc
    stamp = Image.new("RGBA", (side, side), background)
    stamp.alpha_composite(logo, ((side - logo.width) // 2, (side - logo.height) // 2))
    return stamp


def render_png(payload: str, style: dict[str, Any], logo_bytes: bytes | None = None) -> bytes:
    """Ảnh PNG của mã QR.

    Args:
        payload: Chuỗi cần mã hóa.
        style: Kiểu dáng (đã validate).
        logo_bytes: Ảnh logo tùy chọn từ Attachment.

    Returns:
        Bytes PNG.
    """
    qr, scale, merged = _make(payload, style, has_logo=logo_bytes is not None)
    buffer = io.BytesIO()
    qr.save(
        buffer,
        kind="png",
        scale=scale,
        border=merged["margin"],
        dark=merged["foreground"],
        light=merged["background"],
    )
    if logo_bytes is None:
        return buffer.getvalue()
    stamp = _logo_stamp(logo_bytes, qr, scale, merged["background"])
    buffer.seek(0)
    with Image.open(buffer) as source:
        image = source.convert("RGBA")
    image.paste(stamp, ((image.width - stamp.width) // 2, (image.height - stamp.height) // 2))
    output = io.BytesIO()
    image.save(output, format="PNG")
    return output.getvalue()


def render_svg_data_url(payload: str, style: dict[str, Any], logo_bytes: bytes | None = None) -> str:
    """SVG dạng data URL để FE hiển thị bằng `<img>` (không chèn SVG thô vào DOM).

    Args:
        payload: Chuỗi cần mã hóa.
        style: Kiểu dáng (đã validate).
        logo_bytes: Ảnh logo tùy chọn từ Attachment.

    Returns:
        `data:image/svg+xml;base64,...`.
    """
    qr, scale, merged = _make(payload, style, has_logo=logo_bytes is not None)
    buffer = io.BytesIO()
    qr.save(
        buffer,
        kind="svg",
        scale=scale,
        border=merged["margin"],
        dark=merged["foreground"],
        light=merged["background"],
        xmldecl=False,
    )
    svg = buffer.getvalue()
    if logo_bytes is not None:
        stamp = _logo_stamp(logo_bytes, qr, scale, merged["background"])
        logo_buffer = io.BytesIO()
        stamp.save(logo_buffer, format="PNG")
        width, _ = qr.symbol_size(scale=scale, border=merged["margin"])
        x = (width - stamp.width) // 2
        logo_data = base64.b64encode(logo_buffer.getvalue()).decode("ascii")
        overlay = (
            f'<image x="{x}" y="{x}" width="{stamp.width}" height="{stamp.height}" '
            f'href="data:image/png;base64,{logo_data}"/>'
        ).encode("ascii")
        svg = svg.replace(b"</svg>", overlay + b"</svg>")
    return "data:image/svg+xml;base64," + base64.b64encode(svg).decode("ascii")
