"""Task dọn thông báo cũ, outbox cũ và thiết bị push lâu không thấy."""

from app.system.services.notification_service import NotificationService


def purge_notifications() -> int:
    """Xóa dữ liệu thông báo quá hạn giữ.

    Returns:
        Số bản ghi đã xóa.
    """
    return NotificationService().cleanup()
