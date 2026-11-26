"""Khóa rate limit của module Finance (`settings.RATE_LIMITS`)."""

from enum import StrEnum

from app.core.constants.module_code import ModuleCode
from app.core.constants.rate_limit_action import RateLimitAction

_MODULE = ModuleCode.FINANCE
_SEPAY = "sepay"


class FinanceRateLimitKey(StrEnum):
    """Mọi khóa giới hạn tần suất cho API của module Finance."""

    SEPAY_CALL = f"{_MODULE}.{_SEPAY}.{RateLimitAction.CALL}"
    SEPAY_WEBHOOK = f"{_MODULE}.{_SEPAY}.{RateLimitAction.WEBHOOK}"
