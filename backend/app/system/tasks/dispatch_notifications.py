"""Task gửi nốt/thử lại thông báo đến hạn (cron dọn dẹp và endpoint dispatch)."""

from app.system.services.notification_service import NotificationService


def dispatch_notifications() -> int:
    """Gửi các bản outbox đến hạn.

    Returns:
        Số bản gửi thành công.
    """
    return NotificationService().dispatch_pending()
