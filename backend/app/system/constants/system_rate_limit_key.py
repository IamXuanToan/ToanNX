"""Khóa rate limit của module System (`settings.RATE_LIMITS`)."""

from enum import StrEnum

from app.core.constants.module_code import ModuleCode
from app.core.constants.rate_limit_action import RateLimitAction

_MODULE = ModuleCode.SYSTEM
_PASSWORD_RESET = "password_reset"  # noqa: S105 - tên nhóm khóa rate limit
_EMAIL_VERIFICATION = "email_verification"
_INVITATION = "invitation"
_SOCIAL = "social"
_CLIENT_ERROR = "client_error"
_ATTACHMENT = "attachment"
_TELEGRAM = "telegram"


class SystemRateLimitKey(StrEnum):
    """Mọi khóa giới hạn tần suất cho API của module System."""

    PASSWORD_RESET_REQUEST = f"{_MODULE}.{_PASSWORD_RESET}.{RateLimitAction.REQUEST}"
    PASSWORD_RESET_VALIDATE = f"{_MODULE}.{_PASSWORD_RESET}.{RateLimitAction.VALIDATE}"
    PASSWORD_RESET_CONFIRM = f"{_MODULE}.{_PASSWORD_RESET}.{RateLimitAction.CONFIRM}"
    EMAIL_VERIFICATION_SEND = f"{_MODULE}.{_EMAIL_VERIFICATION}.{RateLimitAction.SEND}"
    EMAIL_VERIFICATION_VERIFY = f"{_MODULE}.{_EMAIL_VERIFICATION}.{RateLimitAction.VERIFY}"
    INVITATION_VALIDATE = f"{_MODULE}.{_INVITATION}.{RateLimitAction.VALIDATE}"
    INVITATION_ACCEPT = f"{_MODULE}.{_INVITATION}.{RateLimitAction.ACCEPT}"
    SOCIAL_AUTH = f"{_MODULE}.{_SOCIAL}.{RateLimitAction.AUTH}"
    SOCIAL_LINK = f"{_MODULE}.{_SOCIAL}.{RateLimitAction.LINK}"
    SOCIAL_UNLINK = f"{_MODULE}.{_SOCIAL}.{RateLimitAction.UNLINK}"
    CLIENT_ERROR_CREATE = f"{_MODULE}.{_CLIENT_ERROR}.{RateLimitAction.CREATE}"
    ATTACHMENT_CONTENT = f"{_MODULE}.{_ATTACHMENT}.{RateLimitAction.CONTENT}"
    TELEGRAM_CALL = f"{_MODULE}.{_TELEGRAM}.{RateLimitAction.CALL}"
    TELEGRAM_WEBHOOK = f"{_MODULE}.{_TELEGRAM}.{RateLimitAction.WEBHOOK}"
