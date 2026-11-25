"""Kiểm tra file SVG an toàn trước khi lưu.

SVG là XML có thể chứa JavaScript. File được phục vụ cùng origin nên phải chặn mọi
thứ có thể chạy mã hoặc tải tài nguyên ngoài:
- Parse bằng `defusedxml` (chặn XXE, entity expansion, DTD).
- Phần tử gốc phải là `<svg>` (namespace SVG).
- Không có `<script>`, `<foreignObject>`, `<iframe>`, `<object>`, `<embed>`, `<use>` trỏ ra ngoài...
- Không có thuộc tính sự kiện `on*`.
- `href`/`xlink:href` chỉ được trỏ nội bộ (`#id`); không `javascript:`, `data:`, URL ngoài.
- `style`/`<style>` không chứa `url(` ra ngoài, `@import`, `expression(`, `javascript:`.
"""

import re
from typing import IO

from defusedxml import ElementTree
from defusedxml.common import DefusedXmlException

SVG_CONTENT_TYPE = "image/svg+xml"
SVG_NAMESPACE = "http://www.w3.org/2000/svg"

_FORBIDDEN_TAGS = frozenset(
    {
        "script",
        "foreignobject",
        "iframe",
        "object",
        "embed",
        "audio",
        "video",
        "handler",
        "listener",
        "animate",
        "animatetransform",
        "animatemotion",
        "set",
        "discard",
        "mpath",
    }
)
_HREF_ATTRIBUTES = frozenset({"href", "{http://www.w3.org/1999/xlink}href"})
_URL_ATTRIBUTES = frozenset({"href", "src", "from", "to", "values", "by", "action"})
_DANGEROUS_STYLE = re.compile(
    r"@import|expression\s*\(|-moz-binding|behavior\s*:|javascript:|vbscript:|url\(\s*['\"]?(?!#)",
    re.IGNORECASE,
)
_DANGEROUS_VALUE = re.compile(
    r"javascript:|vbscript:|data\s*:\s*(?:text/html|application/|image/svg\+xml)",
    re.IGNORECASE,
)
_WHITESPACE_CONTROL = re.compile(r"[\s\x00-\x1f\x7f]+")
_TEXT_SNIFF = re.compile(rb"^\s*(<\?xml[^>]*>\s*)?(<!--.*?-->\s*)*<svg[\s>]", re.DOTALL | re.IGNORECASE)
_SNIFF_SIZE = 1024


def looks_like_svg(header: bytes) -> bool:
    """Phần đầu file có dạng tài liệu SVG (bỏ qua BOM, khai báo XML, comment).

    Args:
        header: Các byte đầu của file.

    Returns:
        True nếu giống SVG.
    """
    return bool(_TEXT_SNIFF.match(header.removeprefix(b"\xef\xbb\xbf")[:_SNIFF_SIZE]))


def find_svg_problem(stream: IO[bytes]) -> str | None:
    """Tìm lý do SVG không an toàn; trả con trỏ về đầu file.

    Args:
        stream: File SVG.

    Returns:
        Mô tả vấn đề, hoặc None nếu SVG an toàn.
    """
    stream.seek(0)
    try:
        root = ElementTree.parse(stream).getroot()
    except (ElementTree.ParseError, DefusedXmlException):
        return "SVG không hợp lệ hoặc chứa DTD/entity."
    finally:
        stream.seek(0)

    if root is None or root.tag != f"{{{SVG_NAMESPACE}}}svg":
        return "Phần tử gốc phải là <svg> với namespace SVG."

    for element in root.iter():
        tag = element.tag.rsplit("}", 1)[-1].lower() if isinstance(element.tag, str) else ""
        if tag in _FORBIDDEN_TAGS:
            return f"SVG không được chứa <{tag}>."
        if tag == "style" and element.text:
            collapsed_css = _WHITESPACE_CONTROL.sub("", element.text)
            if _DANGEROUS_STYLE.search(element.text) or _DANGEROUS_VALUE.search(collapsed_css):
                return "SVG chứa CSS không an toàn."
        for name, value in element.attrib.items():
            local = name.rsplit("}", 1)[-1].lower()
            if local.startswith("on"):
                return f"SVG không được chứa thuộc tính sự kiện `{local}`."
            if name in _HREF_ATTRIBUTES and not value.strip().startswith("#"):
                return "SVG chỉ được liên kết nội bộ (#id)."
            if local == "style" and _DANGEROUS_STYLE.search(value):
                return "SVG chứa CSS không an toàn."
            collapsed_value = _WHITESPACE_CONTROL.sub("", value)
            if _DANGEROUS_VALUE.search(collapsed_value):
                return "SVG chứa URI/script không an toàn."
            if (
                local in _URL_ATTRIBUTES
                and value.strip()
                and not value.strip().startswith("#")
                and "://" in collapsed_value
            ):
                return f"SVG không được trỏ tài nguyên ngoài qua `{local}`."
    return None
