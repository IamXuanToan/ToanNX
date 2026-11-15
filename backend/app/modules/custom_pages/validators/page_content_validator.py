"""Kiểm tài liệu Tiptap JSON của trang: chỉ node/mark/attr trong danh sách cho phép.

Sai thì 400 kèm vị trí node (`content.0.content.2`). Trả về tài liệu đã chuẩn hóa cùng tập id ảnh Thư viện và
link rút gọn để service kiểm quyền sở hữu (phải thuộc **chủ trang**).

Mã QR không phải node riêng: chèn mã QR là chèn node `image` có `attachmentId` của ảnh mã QR.
"""

import json
from dataclasses import dataclass, field
from typing import Any, NoReturn
from urllib.parse import urlsplit
from uuid import UUID

from django.conf import settings

from app.core.exceptions.validation_error import ValidationError

_LINK_SCHEMES = frozenset({"http", "https", "mailto", "tel"})
_YOUTUBE_HOSTS = frozenset(
    {
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "youtu.be",
        "www.youtube-nocookie.com",
        "youtube-nocookie.com",
    }
)
_ALIGN = frozenset({"left", "center", "right", "justify"})
_TONES = frozenset({"info", "success", "warning", "danger"})
_SOCIAL = frozenset(
    {"facebook", "instagram", "tiktok", "youtube", "x", "linkedin", "github", "zalo", "email", "website"}
)
_HEX = frozenset("0123456789abcdefABCDEF")
MAX_DEPTH = 20
MAX_TABLE_COLUMNS = 20
MAX_TABLE_ROWS = 100
MAX_TEXT_LENGTH = 10_000

# node → (attr được phép, có `content` con hay không)
_NODES: dict[str, tuple[frozenset[str], bool]] = {
    "doc": (frozenset(), True),
    "paragraph": (frozenset({"textAlign"}), True),
    "heading": (frozenset({"level", "textAlign"}), True),
    "text": (frozenset(), False),
    "hardBreak": (frozenset(), False),
    "bulletList": (frozenset(), True),
    "orderedList": (frozenset({"start", "type"}), True),
    "listItem": (frozenset(), True),
    "taskList": (frozenset(), True),
    "taskItem": (frozenset({"checked"}), True),
    "blockquote": (frozenset(), True),
    "codeBlock": (frozenset({"language"}), True),
    "horizontalRule": (frozenset(), False),
    "table": (frozenset(), True),
    "tableRow": (frozenset(), True),
    "tableHeader": (frozenset({"colspan", "rowspan", "colwidth"}), True),
    "tableCell": (frozenset({"colspan", "rowspan", "colwidth"}), True),
    "image": (frozenset({"src", "alt", "title", "attachmentId", "width"}), False),
    "youtube": (frozenset({"src", "width", "height", "start"}), False),
    "button": (frozenset({"label", "href", "shortLinkId", "variant"}), False),
    "columns": (frozenset({"count"}), True),
    "column": (frozenset(), True),
    "callout": (frozenset({"tone"}), True),
    "socialLinks": (frozenset({"items"}), False),
    "spacer": (frozenset({"size"}), False),
}
_MARKS: dict[str, frozenset[str]] = {
    "bold": frozenset(),
    "italic": frozenset(),
    "underline": frozenset(),
    "strike": frozenset(),
    "code": frozenset(),
    "link": frozenset({"href", "target", "rel", "class"}),
    "highlight": frozenset({"color"}),
    "textStyle": frozenset({"color"}),
}


@dataclass
class PageContentRefs:
    """Tham chiếu sang module khác cần kiểm quyền sở hữu và đếm giới hạn."""

    attachment_ids: set[str] = field(default_factory=set)
    short_link_ids: set[str] = field(default_factory=set)
    images: int = 0
    videos: int = 0


def _fail(path: str, message: str) -> NoReturn:
    raise ValidationError(details={"content": [f"{path}: {message}"]})


def _uuid(value: Any, path: str) -> str:
    try:
        return str(UUID(str(value)))
    except (TypeError, ValueError):
        _fail(path, "id không hợp lệ.")


def _url(value: Any, path: str, schemes: frozenset[str]) -> str:
    if not isinstance(value, str) or len(value) > 2048 or any(ord(char) < 32 for char in value):
        _fail(path, "URL không hợp lệ.")
    parts = urlsplit(value)
    if parts.scheme not in schemes or (parts.scheme in {"http", "https"} and not parts.hostname):
        _fail(path, f"Chỉ chấp nhận URL {', '.join(sorted(schemes))}.")
    return str(value)


def _color(value: Any, path: str) -> str:
    if not (isinstance(value, str) and len(value) == 7 and value[0] == "#" and set(value[1:]) <= _HEX):
        _fail(path, "Màu phải dạng #RRGGBB.")
    return str(value).lower()


def _check_attrs(node_type: str, attrs: dict[str, Any], path: str, refs: PageContentRefs) -> dict[str, Any]:
    """Kiểm giá trị attr theo node; trả attr đã chuẩn hóa (bỏ attr null)."""
    attrs = {key: value for key, value in attrs.items() if value is not None}
    if "textAlign" in attrs and attrs["textAlign"] not in _ALIGN:
        _fail(path, "textAlign không hợp lệ.")
    if node_type == "heading" and attrs.get("level") not in (1, 2, 3):
        _fail(path, "Tiêu đề chỉ cấp 1–3.")
    if node_type == "image":
        refs.images += 1
        if "attachmentId" in attrs:
            attrs["attachmentId"] = _uuid(attrs["attachmentId"], path)
            refs.attachment_ids.add(attrs["attachmentId"])
            attrs["src"] = ""  # URL dựng lại lúc trả về theo attachment hiện tại
        else:
            attrs["src"] = _url(attrs.get("src"), path, frozenset({"https"}))
        for key in ("alt", "title"):
            if key in attrs and (not isinstance(attrs[key], str) or len(attrs[key]) > 300):
                _fail(path, f"{key} tối đa 300 ký tự.")
    if node_type == "youtube":
        refs.videos += 1
        src = _url(attrs.get("src"), path, frozenset({"https"}))
        if (urlsplit(src).hostname or "").lower() not in _YOUTUBE_HOSTS:
            _fail(path, "Video chỉ hỗ trợ YouTube.")
    if node_type == "button":
        if not isinstance(attrs.get("label"), str) or not 1 <= len(attrs["label"]) <= 120:
            _fail(path, "Nhãn nút 1–120 ký tự.")
        if "shortLinkId" in attrs:
            attrs["shortLinkId"] = _uuid(attrs["shortLinkId"], path)
            refs.short_link_ids.add(attrs["shortLinkId"])
            attrs["href"] = ""
        else:
            attrs["href"] = _url(attrs.get("href"), path, _LINK_SCHEMES)
    if node_type == "columns" and attrs.get("count") not in (2, 3):
        _fail(path, "Chỉ 2 hoặc 3 cột.")
    if node_type == "callout" and attrs.get("tone", "info") not in _TONES:
        _fail(path, "tone không hợp lệ.")
    if node_type == "spacer" and attrs.get("size", "md") not in {"sm", "md", "lg"}:
        _fail(path, "size chỉ sm, md, lg.")
    if node_type == "socialLinks":
        items = attrs.get("items")
        if not isinstance(items, list) or len(items) > 12:
            _fail(path, "Tối đa 12 liên kết mạng xã hội.")
        items = [item for item in items if isinstance(item, dict)]
        attrs["items"] = [
            {
                "platform": item.get("platform")
                if item.get("platform") in _SOCIAL
                else _fail(path, "platform lạ."),
                "url": _url(item.get("url"), path, _LINK_SCHEMES),
            }
            for item in items
            if isinstance(item, dict)
        ]
    return attrs


def _check_marks(marks: Any, path: str) -> list[dict[str, Any]]:
    if not isinstance(marks, list):
        _fail(path, "marks phải là mảng.")
    result = []
    for index, mark in enumerate(marks):
        mark_path = f"{path}.marks.{index}"
        mark_type = mark.get("type") if isinstance(mark, dict) else None
        if not isinstance(mark_type, str) or mark_type not in _MARKS:
            _fail(mark_path, f"mark '{mark_type}' không được hỗ trợ.")
        attrs = {key: value for key, value in (mark.get("attrs") or {}).items() if value is not None}
        if not set(attrs) <= _MARKS[mark_type]:
            _fail(mark_path, f"attr lạ: {sorted(set(attrs) - _MARKS[mark_type])}.")
        if mark_type == "link":
            attrs["href"] = _url(attrs.get("href"), mark_path, _LINK_SCHEMES)
            attrs["rel"] = "noopener noreferrer nofollow"
        if "color" in attrs:
            attrs["color"] = _color(attrs["color"], mark_path)
        result.append({"type": mark_type, **({"attrs": attrs} if attrs else {})})
    return result


def _check_node(node: Any, path: str, depth: int, refs: PageContentRefs) -> dict[str, Any]:
    if depth > MAX_DEPTH:
        _fail(path, "Lồng quá sâu.")
    node_type = node.get("type") if isinstance(node, dict) else None
    if not isinstance(node_type, str) or node_type not in _NODES:
        _fail(path, f"node '{node_type}' không được hỗ trợ.")
    allowed, has_children = _NODES[node_type]
    unknown_keys = set(node) - {"type", "attrs", "content", "marks", "text"}
    if unknown_keys:
        _fail(path, f"khóa lạ: {sorted(unknown_keys)}.")
    attrs = node.get("attrs") or {}
    if not isinstance(attrs, dict) or not set(attrs) <= allowed:
        _fail(path, f"attr lạ: {sorted(set(attrs) - allowed) if isinstance(attrs, dict) else attrs}.")
    result: dict[str, Any] = {"type": node_type}
    normalized = _check_attrs(node_type, attrs, path, refs)
    if normalized:
        result["attrs"] = normalized
    if node_type == "text":
        text = node.get("text")
        if not isinstance(text, str) or not text or len(text) > MAX_TEXT_LENGTH:
            _fail(path, "text rỗng hoặc quá dài.")
        result["text"] = text
        if node.get("marks"):
            result["marks"] = _check_marks(node["marks"], path)
        return result
    if "marks" in node or "text" in node:
        _fail(path, "chỉ node text có marks/text.")
    children = node.get("content", [])
    if children and not has_children:
        _fail(path, "node này không có nội dung con.")
    if not isinstance(children, list):
        _fail(path, "content phải là mảng.")
    if node_type == "table" and len(children) > MAX_TABLE_ROWS:
        _fail(path, f"Bảng tối đa {MAX_TABLE_ROWS} dòng.")
    if node_type == "tableRow" and len(children) > MAX_TABLE_COLUMNS:
        _fail(path, f"Bảng tối đa {MAX_TABLE_COLUMNS} cột.")
    if children:
        result["content"] = [
            _check_node(child, f"{path}.content.{index}", depth + 1, refs)
            for index, child in enumerate(children)
        ]
    return result


def validate_page_content(value: Any) -> tuple[dict[str, Any], PageContentRefs]:
    """Kiểm và chuẩn hóa tài liệu Tiptap.

    Args:
        value: JSON client gửi.

    Returns:
        (tài liệu đã chuẩn hóa, tham chiếu cần kiểm sở hữu).

    Raises:
        ValidationError: Sai cấu trúc, node/mark lạ, URL nguy hiểm hoặc vượt giới hạn.
    """
    if not isinstance(value, dict) or value.get("type") != "doc":
        _fail("content", "phải là tài liệu Tiptap `{type: 'doc'}`.")
    if len(json.dumps(value, ensure_ascii=False).encode("utf-8")) > settings.CUSTOM_PAGE_CONTENT_MAX_BYTES:
        _fail("content", f"Nội dung vượt {settings.CUSTOM_PAGE_CONTENT_MAX_BYTES // 1024} KB.")
    refs = PageContentRefs()
    document = _check_node(value, "content", 0, refs)
    if refs.images > settings.CUSTOM_PAGE_MAX_IMAGES:
        _fail("content", f"Tối đa {settings.CUSTOM_PAGE_MAX_IMAGES} ảnh.")
    if refs.videos > settings.CUSTOM_PAGE_MAX_VIDEOS:
        _fail("content", f"Tối đa {settings.CUSTOM_PAGE_MAX_VIDEOS} video.")
    return document, refs


def walk_nodes(document: dict[str, Any]) -> list[dict[str, Any]]:
    """Mọi node của tài liệu (duyệt sâu), để dựng bản công khai.

    Args:
        document: Tài liệu đã validate.

    Returns:
        Danh sách node.
    """
    nodes, stack = [], [document]
    while stack:
        node = stack.pop()
        nodes.append(node)
        stack.extend(node.get("content", []))
    return nodes
