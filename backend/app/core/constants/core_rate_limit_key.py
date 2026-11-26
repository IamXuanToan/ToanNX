"""Khóa rate limit dùng chung ở tầng core (`settings.RATE_LIMITS`)."""

from enum import StrEnum

from app.core.constants.rate_limit_action import RateLimitAction

_DEFAULT_SCOPE = "default"
_PUBLIC_SCOPE = "public"


class CoreRateLimitKey(StrEnum):
    """Khóa giới hạn tần suất mặc định hoặc công khai dùng chung giữa các module."""

    DEFAULT_WRITE = f"{_DEFAULT_SCOPE}.{RateLimitAction.WRITE}"
    PUBLIC_READ = f"{_PUBLIC_SCOPE}.{RateLimitAction.READ}"
