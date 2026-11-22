"""Repository thông báo hệ thống."""

from django.db.models import QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.system.models.system_announcement import SystemAnnouncement


class SystemAnnouncementRepository(CoreRepository[SystemAnnouncement]):
    """Truy cập dữ liệu SystemAnnouncement."""

    model = SystemAnnouncement

    def get_queryset(self) -> QuerySet[SystemAnnouncement]:
        """Kèm vai trò nhận."""
        return super().get_queryset().prefetch_related("roles")
