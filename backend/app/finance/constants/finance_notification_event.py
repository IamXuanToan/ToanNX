"""Mã sự kiện thông báo của module Tài chính."""

from enum import StrEnum


class FinanceNotificationEvent(StrEnum):
    """Sự kiện phát qua `NotificationService.notify`."""

    INCOME_RECEIVED = "finance.income.received"
    INCOME_NEEDS_REVIEW = "finance.income.needs_review"
    WEBHOOK_AUTH_FAILED = "finance.sepay.webhook_auth_failed"
