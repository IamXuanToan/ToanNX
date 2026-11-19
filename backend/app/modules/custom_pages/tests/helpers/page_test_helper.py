"""Helper functions cho kiểm thử custom_pages."""

from typing import Any

from app.modules.custom_pages.models.page_path import PagePath
from app.modules.qr_codes.services.qr_code_service import QrCodeService


def make_doc(*nodes: dict[str, Any]) -> dict[str, Any]:
    """Tạo cấu trúc document Tiptap hợp lệ."""
    return {"type": "doc", "content": list(nodes)}


def make_paragraph(text: str) -> dict[str, Any]:
    """Tạo paragraph node Tiptap."""
    return {"type": "paragraph", "content": [{"type": "text", "text": text}]}


def get_seeded_path(segment: str) -> PagePath:
    """Lấy PagePath đã seed sẵn."""
    return PagePath.objects.get(segment=segment)


def create_qr_image(owner: Any) -> str:
    """Tạo mã QR để lấy ID ảnh attachment cho kiểm thử chèn ảnh vào trang."""
    qr = QrCodeService().create(
        owner,
        {
            "name": "QR Trang",
            "qr_type": "TEXT",
            "content": {"text": "hello"},
            "design": {"size": 128, "margin": 2, "error_correction": "M"},
        },
    )
    return str(qr.image_id)
