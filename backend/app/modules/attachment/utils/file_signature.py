"""Nhận diện kiểu file từ chữ ký (magic bytes) thay vì tin `Content-Type` của client.

SVG là văn bản (không có magic bytes) nên nhận diện theo cấu trúc phần đầu tài liệu;
độ an toàn của nội dung kiểm tra riêng bằng `svg_inspector.find_svg_problem`.
"""

from django.core.files import File

from app.modules.attachment.utils.svg_inspector import SVG_CONTENT_TYPE, looks_like_svg

_SIGNATURES: tuple[tuple[bytes, int, str], ...] = (
    (b"\x89PNG\r\n\x1a\n", 0, "image/png"),
    (b"\xff\xd8\xff", 0, "image/jpeg"),
    (b"GIF87a", 0, "image/gif"),
    (b"GIF89a", 0, "image/gif"),
    (b"WEBP", 8, "image/webp"),
    (b"%PDF-", 0, "application/pdf"),
)
_HEADER_SIZE = 16
_TEXT_HEADER_SIZE = 1024


def detect_content_type(stream: File) -> str | None:
    """Đọc vài byte đầu để xác định MIME type; trả con trỏ về đầu file.

    Args:
        stream: File upload (Django File).

    Returns:
        MIME type hoặc None nếu không nhận diện được.
    """
    stream.seek(0)
    header = stream.read(_TEXT_HEADER_SIZE)
    stream.seek(0)
    for signature, offset, content_type in _SIGNATURES:
        if header[offset : offset + len(signature)] == signature:
            if content_type == "image/webp" and not header.startswith(b"RIFF"):
                continue
            return content_type
    if looks_like_svg(header):
        return SVG_CONTENT_TYPE
    return None
