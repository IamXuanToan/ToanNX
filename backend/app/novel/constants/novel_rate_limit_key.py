"""Khóa rate limit của module Novel (`settings.RATE_LIMITS`)."""

from enum import StrEnum

from app.core.constants.module_code import ModuleCode
from app.core.constants.rate_limit_action import RateLimitAction

_MODULE = ModuleCode.NOVEL


class NovelRateLimitKey(StrEnum):
    """Mọi khóa giới hạn tần suất cho API của module Novel."""

    CREATE = f"{_MODULE}.{RateLimitAction.CREATE}"
    IMPORT = f"{_MODULE}.{RateLimitAction.IMPORT}"
