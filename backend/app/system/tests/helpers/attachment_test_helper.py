"""Helper functions and sample data for attachment tests."""

import io
import zipfile
from typing import Any

from django.core.files.uploadedfile import SimpleUploadedFile

PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
PDF_BYTES = b"%PDF-1.7\n" + b"\x00" * 64
SAFE_SVG = (
    b'<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">'
    b'<defs><linearGradient id="g"/></defs><path d="M0 0h24v24H0z" fill="url(#g)"/></svg>'
)
UNSAFE_SVGS = {
    "script": b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    "event": b'<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>',
    "external_href": (
        b'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">'
        b'<image xlink:href="https://evil.test/x.png"/></svg>'
    ),
    "foreign_object": b'<svg xmlns="http://www.w3.org/2000/svg"><foreignObject/></svg>',
    "css_import": b'<svg xmlns="http://www.w3.org/2000/svg"><style>@import url(x.css);</style></svg>',
    "entity": (
        b'<?xml version="1.0"?><!DOCTYPE svg [<!ENTITY x "y">]>'
        b'<svg xmlns="http://www.w3.org/2000/svg">&x;</svg>'
    ),
}


CSV_BYTES = b"ngay,so_tien,noi_dung\n2026-11-21,2450000,SHOPEE AFFILIATE\n"
XML_BYTES = b'<?xml version="1.0" encoding="UTF-8"?><HDon><TTChung><SHDon>123</SHDon></TTChung></HDon>'
XML_WITH_DTD = b'<?xml version="1.0"?><!DOCTYPE x [<!ENTITY a "b">]><x>&a;</x>'


def build_xlsx_bytes() -> bytes:
    """XLSX tối thiểu (zip có `[Content_Types].xml` và `xl/workbook.xml`)."""
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("[Content_Types].xml", "<Types/>")
        archive.writestr("xl/workbook.xml", "<workbook/>")
    return buffer.getvalue()


def upload_file(
    api: Any,
    name: str,
    content: bytes,
    content_type: str,
    folder_id: str | None = None,
    visibility: str | None = None,
) -> Any:
    """Upload helper gửi multipart/form-data lên /api/v1/system/attachments."""
    payload: dict[str, Any] = {"file": SimpleUploadedFile(name, content, content_type)}
    if folder_id:
        payload["folder_id"] = folder_id
    if visibility:
        payload["visibility"] = visibility
    return api.post("/api/v1/system/attachments", payload, format="multipart")
