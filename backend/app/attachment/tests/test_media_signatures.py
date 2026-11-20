"""Kiểm tra chữ ký video và loại trừ định dạng có container tương tự."""

from io import BytesIO

import pytest
from django.core.files import File

from app.attachment.utils.file_signature import detect_content_type


@pytest.mark.parametrize(
    ("content", "expected"),
    [
        (b"\x00\x00\x00\x18ftypisom\x00\x00\x00\x00isommp42", "video/mp4"),
        (b"\x00\x00\x00\x14ftypqt  \x00\x00\x00\x00qt  ", "video/quicktime"),
        (b"\x1a\x45\xdf\xa3\x9f\x42\x82\x84webm", "video/webm"),
        (b"\x00\x00\x00\x14ftypavif\x00\x00\x00\x00avif", None),
        (b"\x00\x00\x00\x14ftypheic\x00\x00\x00\x00heic", None),
        (b"\x00\x00\x10\x00ftypisom\x00\x00\x00\x00isom", None),
        (b"\x1a\x45\xdf\xa3not-a-webm", None),
    ],
)
def test_media_signatures(content: bytes, expected: str | None) -> None:
    """Nhận video từ nội dung và luôn trả con trỏ stream về đầu."""
    stream = File(BytesIO(content))
    assert detect_content_type(stream) == expected
    assert stream.tell() == 0
