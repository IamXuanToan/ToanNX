"""Kiểm tra chữ ký video và loại trừ định dạng có container tương tự."""

from io import BytesIO

import pytest
from django.core.files import File

from app.system.utils.file_signature import detect_content_type
from app.system.utils.svg_inspector import find_svg_problem, looks_like_svg


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


def test_svg_rejects_xml_stylesheet_processing_instruction() -> None:
    """Từ chối SVG chứa <?xml-stylesheet?> hoặc processing instruction không phải XML declaration."""
    evil_svg = (
        b'<?xml-stylesheet type="text/xsl" href="https://evil.example/x.xsl"?>'
        b'<svg xmlns="http://www.w3.org/2000/svg"><circle cx="5" cy="5" r="4"/></svg>'
    )
    assert looks_like_svg(evil_svg) is False
    stream = BytesIO(evil_svg)
    assert find_svg_problem(stream) is not None

    nested_pi = (
        b'<?xml version="1.0" encoding="UTF-8"?>'
        b'<svg xmlns="http://www.w3.org/2000/svg">'
        b'<?xml-stylesheet href="x.xsl"?><rect width="1" height="1"/></svg>'
    )
    assert find_svg_problem(BytesIO(nested_pi)) is not None

    valid_svg = (
        b'<?xml version="1.0" encoding="UTF-8"?>'
        b'<svg xmlns="http://www.w3.org/2000/svg"><circle cx="5" cy="5" r="4"/></svg>'
    )
    assert looks_like_svg(valid_svg) is True
    assert find_svg_problem(BytesIO(valid_svg)) is None
