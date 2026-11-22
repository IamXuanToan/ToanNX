"""Lấy IP client từ request."""

from django.http import HttpRequest


def get_client_ip(request: HttpRequest) -> str:
    """IP client: phần tử cuối của X-Forwarded-For (do proxy gần nhất thêm) hoặc REMOTE_ADDR.

    Args:
        request: HTTP request.

    Returns:
        Chuỗi IP (có thể rỗng).
    """
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded:
        return str(forwarded.split(",")[-1].strip())
    return str(request.META.get("REMOTE_ADDR", ""))
