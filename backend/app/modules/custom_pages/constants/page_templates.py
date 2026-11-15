"""Mẫu "Bắt đầu từ" khi tạo trang: tài liệu Tiptap ban đầu (người dùng sửa tiếp trong editor)."""

from typing import Any


def _paragraph(text: str) -> dict[str, Any]:
    return {"type": "paragraph", "content": [{"type": "text", "text": text}]}


def _heading(text: str, level: int = 1) -> dict[str, Any]:
    return {"type": "heading", "attrs": {"level": level}, "content": [{"type": "text", "text": text}]}


PAGE_TEMPLATES: dict[str, dict[str, Any]] = {
    "blank": {"type": "doc", "content": [{"type": "paragraph"}]},
    "link_in_bio": {
        "type": "doc",
        "content": [
            _heading("Xin chào!"),
            _paragraph("Một vài liên kết của mình:"),
            {
                "type": "button",
                "attrs": {"label": "Website", "href": "https://toannx.com", "variant": "primary"},
            },
            {"type": "socialLinks", "attrs": {"items": []}},
        ],
    },
    "about": {
        "type": "doc",
        "content": [
            _heading("Giới thiệu"),
            _paragraph("Viết vài dòng về bạn ở đây."),
            _heading("Liên hệ", 2),
        ],
    },
    "donate": {
        "type": "doc",
        "content": [
            _heading("Ủng hộ mình một ly cà phê"),
            _paragraph("Bấm “Mã QR” trên thanh công cụ để chèn mã QR chuyển khoản của bạn."),
        ],
    },
}

TEMPLATE_CHOICES = tuple(PAGE_TEMPLATES)
