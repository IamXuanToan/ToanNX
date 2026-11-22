"""Hàm tiện ích xác định frontend origin từ HTTP request."""

import logging
from urllib.parse import urlsplit

from django.conf import settings
from django.http import HttpRequest

logger = logging.getLogger("app.auth.frontend_url")


def get_frontend_origin(request: HttpRequest | None = None) -> str:
    """Lấy origin của Frontend từ request (hỗ trợ nhiều domain / port FE khác nhau).

    Thứ tự ưu tiên:
    1. Header `Origin` của request (trình duyệt tự động gửi khi thực hiện POST).
    2. Header `Referer` của request.
    3. `request.build_absolute_uri('/')` (tự động nhận X-Forwarded-Host và Proto qua proxy).
    4. Fallback setting `FRONTEND_URL` nếu có, hoặc mặc định `http://localhost:3000`.

    Args:
        request: HTTP request hiện tại (có thể None khi gọi ngoài web context).

    Returns:
        Chuỗi origin chuẩn (ví dụ: 'https://toannx.com' hoặc
        'http://localhost:3000'), không có gạch chéo cuối.
    """
    if request is not None:
        # 1. Kiểm tra Origin header
        origin = request.headers.get("origin") or request.META.get("HTTP_ORIGIN")
        if origin:
            parts = urlsplit(origin.strip())
            if parts.scheme in ("http", "https") and parts.netloc:
                return f"{parts.scheme}://{parts.netloc}".rstrip("/")

        # 2. Kiểm tra Referer header
        referer = request.headers.get("referer") or request.META.get("HTTP_REFERER")
        if referer:
            parts = urlsplit(referer.strip())
            if parts.scheme in ("http", "https") and parts.netloc:
                return f"{parts.scheme}://{parts.netloc}".rstrip("/")

        # 3. Dựng từ request URI (tận dụng USE_X_FORWARDED_HOST và SECURE_PROXY_SSL_HEADER)
        try:
            base_uri = request.build_absolute_uri("/")
            parts = urlsplit(base_uri.strip())
            if parts.scheme in ("http", "https") and parts.netloc:
                return f"{parts.scheme}://{parts.netloc}".rstrip("/")
        except (ValueError, AttributeError):
            logger.warning("Không thể dựng absolute_uri từ request")

    # 4. Fallback setting nếu có
    fallback = getattr(settings, "FRONTEND_URL", "")
    if fallback:
        return str(fallback).rstrip("/")

    return "http://localhost:3000"
