"""Tiện ích URL: kiểm URL do người dùng nhập và dựng URL tuyệt đối theo request.

URL tuyệt đối lấy domain từ request hiện tại (sau proxy: `X-Forwarded-Host` / `X-Forwarded-Proto`, xem
`USE_X_FORWARDED_HOST`, `SECURE_PROXY_SSL_HEADER`), nên FE dùng được ngay, không tự nối domain.
"""

from urllib.parse import urlsplit

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
