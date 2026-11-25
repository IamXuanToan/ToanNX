"""Hàm tiện ích xác định frontend origin từ HTTP request."""

import logging
import re
from urllib.parse import urlsplit

from django.conf import settings
from django.http import HttpRequest

logger = logging.getLogger("app.auth.frontend_url")


def _normalize_origin(raw: str | None) -> str | None:
    """Chuẩn hóa URL thành `scheme://netloc` (http/https), trả None nếu không hợp lệ."""
    if not raw:
        return None
    parts = urlsplit(raw.strip())
    if parts.scheme in ("http", "https") and parts.netloc:
        return f"{parts.scheme.lower()}://{parts.netloc.lower()}".rstrip("/")
    return None


def trusted_frontend_origins() -> set[str]:
    """Tập origin Frontend tin cậy từ `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS` và `CSRF_TRUSTED_ORIGINS`."""
    candidates: list[str] = []
    fallback = getattr(settings, "FRONTEND_URL", "")
    if fallback:
        candidates.append(str(fallback))
    candidates.extend(str(item) for item in getattr(settings, "CORS_ALLOWED_ORIGINS", []))
    candidates.extend(str(item) for item in getattr(settings, "CSRF_TRUSTED_ORIGINS", []))
    return {normalized for raw in candidates if (normalized := _normalize_origin(raw)) is not None}


def _matches_allowed_origin_regex(origin: str) -> bool:
    """Kiểm tra origin khớp danh sách regex frontend được cấu hình (`CORS_ALLOWED_ORIGIN_REGEXES`)."""
    patterns = getattr(settings, "CORS_ALLOWED_ORIGIN_REGEXES", ()) or ()
    return any(re.match(pattern, origin) is not None for pattern in patterns)


def _is_allowed_origin(origin: str | None, trusted: set[str]) -> bool:
    return origin is not None and (origin in trusted or _matches_allowed_origin_regex(origin))


def is_trusted_frontend_origin(url: str | None) -> bool:
    """Kiểm tra URL có thuộc một origin Frontend được cấu hình tin cậy hay không."""
    normalized = _normalize_origin(url)
    return _is_allowed_origin(normalized, trusted_frontend_origins())


def get_frontend_origin(request: HttpRequest | None = None, *, prefer_configured: bool = False) -> str:
    """Lấy origin tin cậy của Frontend từ request (chống Origin/Referer spoofing).

    Thứ tự ưu tiên:
    1. Header `Origin` nếu thuộc danh sách origin tin cậy.
    2. Header `Referer` nếu thuộc danh sách origin tin cậy.
    3. Khi `prefer_configured=True`: ưu tiên `FRONTEND_URL` nếu đã cấu hình (dùng cho email đặt lại mật khẩu /
       xác minh email để không rơi về host backend khi thiếu Origin).
    4. `request.build_absolute_uri('/')` (Django kiểm `ALLOWED_HOSTS` chống Host header poisoning).
    5. Fallback setting `FRONTEND_URL` nếu có, hoặc mặc định `http://localhost:3000`.

    Args:
        request: HTTP request hiện tại (có thể None khi gọi ngoài web context).
        prefer_configured: Ưu tiên `FRONTEND_URL` trước `request.build_absolute_uri('/')`.

    Returns:
        Chuỗi origin chuẩn (ví dụ: 'https://toannx.com' hoặc
        'http://localhost:3000'), không có gạch chéo cuối.
    """
    trusted = trusted_frontend_origins()
    if request is not None:
        # 1. Kiểm tra Origin header nhưng chỉ chấp nhận khi nằm trong allowlist
        origin = _normalize_origin(request.headers.get("origin") or request.META.get("HTTP_ORIGIN"))
        if origin and _is_allowed_origin(origin, trusted):
            return origin

        # 2. Kiểm tra Referer header nhưng chỉ chấp nhận khi nằm trong allowlist
        referer = _normalize_origin(request.headers.get("referer") or request.META.get("HTTP_REFERER"))
        if referer and _is_allowed_origin(referer, trusted):
            return referer

    fallback = _normalize_origin(str(getattr(settings, "FRONTEND_URL", "") or ""))
    if prefer_configured and fallback:
        return fallback

    if request is not None:
        # 3. Dựng từ request URI (Django đã kiểm ALLOWED_HOSTS)
        try:
            base_uri = _normalize_origin(request.build_absolute_uri("/"))
            if base_uri:
                return base_uri
        except (ValueError, AttributeError):
            logger.warning("Không thể dựng absolute_uri từ request")

    # 4. Fallback setting nếu có
    if fallback:
        return fallback

    return "http://localhost:3000"
