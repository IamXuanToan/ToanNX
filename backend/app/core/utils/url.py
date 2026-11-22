"""Tiện ích URL: kiểm URL do người dùng nhập và dựng URL tuyệt đối theo request.

URL tuyệt đối lấy domain từ request hiện tại (sau proxy: `X-Forwarded-Host` / `X-Forwarded-Proto`, xem
`USE_X_FORWARDED_HOST`, `SECURE_PROXY_SSL_HEADER`), nên FE dùng được ngay, không tự nối domain.
"""

from typing import Any
from urllib.parse import urlsplit

from django.conf import settings
from django.http.request import split_domain_port, validate_host

from app.core.context.user_context import get_current_request
from app.core.exceptions.validation_error import ValidationError


def validate_public_url(value: str, field: str = "destination_url") -> str:
    """Chỉ nhận URL http(s) tuyệt đối, có host, không chứa credential hay control character."""
    if (
        not isinstance(value, str)
        or len(value) > 2048
        or any(ord(char) < 32 or ord(char) == 127 for char in value)
    ):
        raise ValidationError(details={field: ["URL không hợp lệ hoặc quá dài."]})
    try:
        parts = urlsplit(value)
        if parts.scheme not in {"http", "https"} or not parts.hostname or parts.username or parts.password:
            raise ValueError
        _ = parts.port
    except ValueError as exc:
        raise ValidationError(details={field: ["Chỉ chấp nhận URL http/https tuyệt đối."]}) from exc
    return value


def build_backend_url(path: str) -> str:
    """URL tuyệt đối trỏ thẳng **domain backend** đang nhận request (không phải domain FE đã proxy qua).

    Dùng cho URL bên thứ ba gọi thẳng backend (webhook): lấy `Host` thật của request (khi FE rewrite, Host
    là domain backend; chạy local là `localhost:8000`), kiểm theo `ALLOWED_HOSTS`. Đổi site vẫn đúng.

    Args:
        path: Đường dẫn bắt đầu bằng `/`.

    Returns:
        URL tuyệt đối; ngoài request hoặc Host không hợp lệ trả nguyên `path`.
    """
    request = get_current_request()
    if request is None:
        return path
    host = request.META.get("HTTP_HOST") or _server_host(request.META)
    if not host or not validate_host(split_domain_port(host)[0], settings.ALLOWED_HOSTS):
        return path
    return f"{request.scheme}://{host}{path}"


def build_absolute_url(url: str) -> str:
    """Biến đường dẫn tương đối (ví dụ `/media/...`) thành URL tuyệt đối.

    Args:
        url: URL tương đối hoặc tuyệt đối (object storage giữ nguyên).

    Returns:
        URL tuyệt đối; ngoài request (shell, command) trả nguyên giá trị vào.
    """
    if not url or "://" in url:
        return url
    request = get_current_request()
    if request is None:
        return url
    return str(request.build_absolute_uri(url))


def _server_host(meta: Any) -> str:
    """Host từ SERVER_NAME/SERVER_PORT khi request không có header Host (client nội bộ, test)."""
    name, port = str(meta.get("SERVER_NAME", "")), str(meta.get("SERVER_PORT", ""))
    return name if port in ("", "80", "443") else f"{name}:{port}"
