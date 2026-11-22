"""Repository tùy chọn thông báo."""

from typing import Any

from django.db.models import QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.system.models.notification_preference import NotificationPreference


class NotificationPreferenceRepository(CoreRepository[NotificationPreference]):
    """Truy cập dữ liệu NotificationPreference (dòng tùy chọn xóa cứng khi đồng bộ)."""

    model = NotificationPreference

    def for_users(self, user_ids: list[Any], event_code: str) -> QuerySet[NotificationPreference]:
        """Tùy chọn của nhiều người cho một sự kiện (kèm chat Telegram)."""
        return (
            self.get_queryset()
            .filter(user_id__in=user_ids, event_code=event_code)
            .select_related("telegram_chat")
        )

    def for_user(self, user_id: Any) -> QuerySet[NotificationPreference]:
        """Mọi tùy chọn của một người."""
        return self.get_queryset().filter(user_id=user_id)
