"""Helper functions and sample data for attachment tests."""

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


def upload_file(api: Any, name: str, content: bytes, content_type: str, folder_id: str | None = None) -> Any:
    """Upload helper gửi multipart/form-data lên /api/v1/system/attachments."""
    payload: dict[str, Any] = {"file": SimpleUploadedFile(name, content, content_type)}
    if folder_id:
        payload["folder_id"] = folder_id
    return api.post("/api/v1/system/attachments", payload, format="multipart")
