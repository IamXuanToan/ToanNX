"""Nhận diện kiểu file từ chữ ký (magic bytes) thay vì tin `Content-Type` của client.

SVG là văn bản (không có magic bytes) nên nhận diện theo cấu trúc phần đầu tài liệu;
độ an toàn của nội dung kiểm tra riêng bằng `svg_inspector.find_svg_problem`.
"""

from django.core.files import File

from app.system.utils.svg_inspector import SVG_CONTENT_TYPE, looks_like_svg

_SIGNATURES: tuple[tuple[bytes, int, str], ...] = (
    (b"\x89PNG\r\n\x1a\n", 0, "image/png"),
    (b"\xff\xd8\xff", 0, "image/jpeg"),
    (b"GIF87a", 0, "image/gif"),
    (b"GIF89a", 0, "image/gif"),
    (b"WEBP", 8, "image/webp"),
    (b"%PDF-", 0, "application/pdf"),
)
_TEXT_HEADER_SIZE = 1024
_FTYP_MIN_SIZE = 16
_MP4_BRANDS = frozenset(
    (b"isom", b"iso2", b"iso3", b"iso4", b"iso5", b"iso6", b"mp41", b"mp42", b"avc1", b"M4V ")
)
_WEBM_HEADER = b"\x1a\x45\xdf\xa3"
_WEBM_DOCTYPE = b"\x42\x82\x84webm"


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
    # Chỉ nhận brand video đã biết, không coi mọi ftyp (như AVIF/HEIC) là video.
    # Brand: https://mp4ra.org/registered-types/brands; DocType: https://www.webmproject.org/docs/container/
    if header[4:8] == b"ftyp" and len(header) >= _FTYP_MIN_SIZE:
        box_size = int.from_bytes(header[:4], "big")
        if _FTYP_MIN_SIZE <= box_size <= len(header):
            if header[8:12] == b"qt  ":
                return "video/quicktime"
            if header[8:12] in _MP4_BRANDS:
                return "video/mp4"
    if header.startswith(_WEBM_HEADER) and _WEBM_DOCTYPE in header:
        return "video/webm"
    return None
