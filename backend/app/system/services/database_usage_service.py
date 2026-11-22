"""Theo dõi dung lượng database so với hạn mức gói free (Neon: 1 GB/project; ghi vượt sẽ bị từ chối)."""

from typing import Any

from django.conf import settings
from django.utils import timezone

from app.system.constants.notification_defaults import DATABASE_WARNING_PERCENT
from app.system.constants.system_notification_event import SystemNotificationEvent
from app.system.repositories.database_repository import DatabaseRepository
from app.system.services.notification_service import NotificationService
from app.system.types.notification_payload import NotificationPayload

PERCENT = 100
MEGABYTE = 1024 * 1024
JOURNAL_PATH = "/admin/journal"


class DatabaseUsageService:
    """Cron dọn dẹp hằng ngày đo `pg_database_size` và cảnh báo (gom theo ngày) khi vượt ngưỡng."""

    def __init__(
        self,
        database_repository: DatabaseRepository | None = None,
        notification_service: NotificationService | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc."""
        self.database_repository = database_repository or DatabaseRepository()
        self.notification_service = notification_service or NotificationService()

    def check_quota(self) -> dict[str, Any]:
        """Đo dung lượng; từ `DATABASE_WARNING_PERCENT` trở lên thì phát cảnh báo.

        Returns:
            `{"used_bytes", "limit_bytes", "percent"}` (percent = 0 khi tắt hạn mức).
        """
        used = self.database_repository.size_bytes()
        limit = settings.DATABASE_MAX_BYTES
        percent = round(used * PERCENT / limit) if limit else 0
        if limit and used * PERCENT >= limit * DATABASE_WARNING_PERCENT:
            self.notification_service.notify(
                SystemNotificationEvent.DATABASE_QUOTA_WARNING,
                dedup_key=f"{timezone.now():%Y%m%d}",
                payload=NotificationPayload(
                    title=f"Database đã dùng {percent}% ({used // MEGABYTE} MB)",
                    body=(
                        "Dọn nhật ký, thông báo cũ hoặc dữ liệu không dùng; Neon free chặn ghi khi vượt 1 GB."
                    ),
                    link=JOURNAL_PATH,
                    message_key="system.notifications.events.databaseQuota",
                    params={"percent": percent, "megabytes": used // MEGABYTE},
                ),
            )
        return {"used_bytes": used, "limit_bytes": limit, "percent": percent}
