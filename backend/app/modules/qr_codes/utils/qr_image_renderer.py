"""Vẽ mã QR ra PNG (lưu Thư viện) và SVG data URL (xem trước) bằng `segno`."""

import base64
import io
from typing import Any

import segno

DEFAULT_STYLE: dict[str, Any] = {
    "size": 512,
    "foreground": "#000000",
    "background": "#FFFFFF",
    "margin": 2,
    "error_correction": "M",
}


def _make(payload: str, style: dict[str, Any]) -> tuple[Any, int, dict[str, Any]]:
    """Tạo symbol và tỉ lệ để ảnh gần đúng kích thước yêu cầu."""
    merged = {**DEFAULT_STYLE, **style}
    qr = segno.make(payload, error=merged["error_correction"].lower(), micro=False)
    width, _ = qr.symbol_size(scale=1, border=merged["margin"])
    scale = max(1, merged["size"] // width)
    return qr, scale, merged


def render_png(payload: str, style: dict[str, Any]) -> bytes:
    """Ảnh PNG của mã QR.

    Args:
        payload: Chuỗi cần mã hóa.
        style: Kiểu dáng (đã validate).

    Returns:
        Bytes PNG.
    """
    qr, scale, merged = _make(payload, style)
    buffer = io.BytesIO()
    qr.save(
        buffer,
        kind="png",
        scale=scale,
        border=merged["margin"],
        dark=merged["foreground"],
        light=merged["background"],
    )
    return buffer.getvalue()


def render_svg_data_url(payload: str, style: dict[str, Any]) -> str:
    """SVG dạng data URL để FE hiển thị bằng `<img>` (không chèn SVG thô vào DOM).

    Args:
        payload: Chuỗi cần mã hóa.
        style: Kiểu dáng (đã validate).

    Returns:
        `data:image/svg+xml;base64,...`.
    """
    qr, scale, merged = _make(payload, style)
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
    return "data:image/svg+xml;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")
