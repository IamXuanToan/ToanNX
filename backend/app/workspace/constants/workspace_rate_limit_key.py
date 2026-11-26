"""Khóa rate limit của module Workspace (`settings.RATE_LIMITS`)."""

from enum import StrEnum

from app.core.constants.module_code import ModuleCode
from app.core.constants.rate_limit_action import RateLimitAction

_MODULE = ModuleCode.WORKSPACE
_ASSET = "asset"
_WARRANTY_CLAIM = "warranty_claim"
_SUBSCRIPTION = "subscription"
_VAULT = "vault"
_MONITOR = "monitor"
_REMINDER = "reminder"
_ASSISTANT = "assistant"
_CRON = "cron"
_TELEGRAM = "telegram"


class WorkspaceRateLimitKey(StrEnum):
    """Mọi khóa giới hạn tần suất cho API của module Workspace."""

    ASSET_CREATE = f"{_MODULE}.{_ASSET}.{RateLimitAction.CREATE}"
    WARRANTY_CLAIM_CREATE = f"{_MODULE}.{_WARRANTY_CLAIM}.{RateLimitAction.CREATE}"
    SUBSCRIPTION_CREATE = f"{_MODULE}.{_SUBSCRIPTION}.{RateLimitAction.CREATE}"
    SUBSCRIPTION_RENEW = f"{_MODULE}.{_SUBSCRIPTION}.{RateLimitAction.RENEW}"
    VAULT_CREATE = f"{_MODULE}.{_VAULT}.{RateLimitAction.CREATE}"
    VAULT_REVEAL = f"{_MODULE}.{_VAULT}.{RateLimitAction.REVEAL}"
    MONITOR_CREATE = f"{_MODULE}.{_MONITOR}.{RateLimitAction.CREATE}"
    MONITOR_PING = f"{_MODULE}.{_MONITOR}.{RateLimitAction.PING}"
    REMINDER_CREATE = f"{_MODULE}.{_REMINDER}.{RateLimitAction.CREATE}"
    ASSISTANT_CHAT = f"{_MODULE}.{_ASSISTANT}.{RateLimitAction.CHAT}"
    CRON_TICK = f"{_MODULE}.{_CRON}.{RateLimitAction.TICK}"
    CRON_DISPATCH_DUE = f"{_MODULE}.{_CRON}.{RateLimitAction.DISPATCH_DUE}"
    TELEGRAM_PROCESS = f"{_MODULE}.{_TELEGRAM}.{RateLimitAction.PROCESS}"
