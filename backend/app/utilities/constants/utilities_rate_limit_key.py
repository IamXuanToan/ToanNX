"""Khóa rate limit của module Utilities (`settings.RATE_LIMITS`)."""

from enum import StrEnum

from app.core.constants.module_code import ModuleCode
from app.core.constants.rate_limit_action import RateLimitAction

_MODULE = ModuleCode.UTILITIES
_SHORT_LINK = "short_link"
_PAGE = "page"
_PAGE_PATH = "page_path"
_QR_CODE = "qr_code"
_DONATION = "donation"
_FEEDBACK = "feedback"


class UtilitiesRateLimitKey(StrEnum):
    """Mọi khóa giới hạn tần suất cho API của module Utilities."""

    SHORT_LINK_CREATE = f"{_MODULE}.{_SHORT_LINK}.{RateLimitAction.CREATE}"
    SHORT_LINK_UNLOCK = f"{_MODULE}.{_SHORT_LINK}.{RateLimitAction.UNLOCK}"
    PAGE_CREATE = f"{_MODULE}.{_PAGE}.{RateLimitAction.CREATE}"
    PAGE_PATH_CREATE = f"{_MODULE}.{_PAGE_PATH}.{RateLimitAction.CREATE}"
    QR_CODE_CREATE = f"{_MODULE}.{_QR_CODE}.{RateLimitAction.CREATE}"
    QR_CODE_PREVIEW = f"{_MODULE}.{_QR_CODE}.{RateLimitAction.PREVIEW}"
    DONATION_WEBHOOK = f"{_MODULE}.{_DONATION}.{RateLimitAction.WEBHOOK}"
    FEEDBACK_SUBMIT = f"{_MODULE}.{_FEEDBACK}.{RateLimitAction.CREATE}"
