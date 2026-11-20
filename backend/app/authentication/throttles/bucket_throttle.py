"""Throttle mặc định toàn hệ thống, đếm bằng bucket PostgreSQL (`RateLimitService`)."""

from typing import Any

from django.conf import settings
from rest_framework.request import Request
from rest_framework.throttling import BaseThrottle

from app.authentication.services.rate_limit_service import RateLimitService
from app.authentication.utils.client_ip import get_client_ip
from app.core.decorators.rate_limit import RATE_LIMIT_ATTR

DEFAULT_WRITE_KEY = "default.write"
_SAFE_METHODS = frozenset({"GET", "HEAD", "OPTIONS"})


class BucketThrottle(BaseThrottle):
    """Đọc khóa rate limit của request rồi đếm.

    - ViewSet: `view.action_rate_limits[view.action]`.
    - APIView: `@rate_limit("…")` trên method.
    - Không khai: method ghi dùng `default.write`; method đọc không giới hạn.

    `settings.RATE_LIMITS[key] = (số lần, cửa sổ giây, "user" | "ip")`.
    Vượt → 429 `RATE_LIMITED` + `Retry-After`.
    Chạy sau kiểm tra quyền (thứ tự của DRF) nên request bị từ chối không tốn lượt.
    """

    def __init__(self) -> None:
        """Khởi tạo service đếm."""
        self.rate_limit_service = RateLimitService()

    def allow_request(self, request: Request, view: Any) -> bool:
        """Đếm một lượt; vượt giới hạn thì ném `RateLimitError`.

        Args:
            request: Request.
            view: View.

        Returns:
            True khi còn lượt.
        """
        key = self._get_key(request, view)
        if key is None:
            return True
        limit, window, scope = settings.RATE_LIMITS[key]
        user = request.user
        subject = (
            f"user:{user.pk}" if scope == "user" and user.is_authenticated else f"ip:{get_client_ip(request)}"
        )
        self.rate_limit_service.hit(f"throttle:{key}:{subject}", limit, window)
        return True

    @staticmethod
    def _get_key(request: Request, view: Any) -> str | None:
        """Khóa rate limit của request (None = không giới hạn)."""
        action = getattr(view, "action", None)
        if action is not None:
            key = getattr(view, "action_rate_limits", {}).get(action)
        else:
            handler = getattr(view, (request.method or "").lower(), None)
            key = getattr(handler, RATE_LIMIT_ATTR, None)
        if key is None and (request.method or "") not in _SAFE_METHODS:
            key = DEFAULT_WRITE_KEY
        return key
