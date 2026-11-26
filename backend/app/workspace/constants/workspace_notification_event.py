"""Mã sự kiện thông báo của module Workspace (khai trong `ModuleDescriptor.notification_events`)."""

from enum import StrEnum


class WorkspaceNotificationEvent(StrEnum):
    """Mọi sự kiện của Workspace phát qua `NotificationService.notify(..., recipient=owner)`."""

    REMINDER_DUE = "workspace.reminder.due"
    DIGEST_DAILY = "workspace.digest.daily"
    WARRANTY_EXPIRING = "workspace.warranty.expiring"
    SUBSCRIPTION_RENEWING = "workspace.subscription.renewing"
    MONITOR_DOWN = "workspace.monitor.down"
    MONITOR_RECOVERED = "workspace.monitor.recovered"
