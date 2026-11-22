"""Thông báo hệ thống: tạo = gửi ngay tới mọi người hoặc theo vai trò; xóa = thu hồi khỏi chuông."""

from typing import Any

from django.db import transaction
from django.utils import timezone

from app.core.services.core_crud_service import CoreCrudService
from app.system.constants.system_notification_event import SystemNotificationEvent
from app.system.models.system_announcement import SystemAnnouncement
from app.system.repositories.system_announcement_repository import SystemAnnouncementRepository
from app.system.repositories.user_repository import UserRepository
from app.system.services.notification_service import NotificationService
from app.system.types.notification_payload import NotificationPayload

EVENT = SystemNotificationEvent.ANNOUNCEMENT_PUBLISHED


class SystemAnnouncementService(CoreCrudService[SystemAnnouncement, SystemAnnouncementRepository]):
    """Tài nguyên chung (không theo owner); quyền do IAM quyết định."""

    repository_class = SystemAnnouncementRepository

    def __init__(
        self,
        repository: SystemAnnouncementRepository | None = None,
        user_repository: UserRepository | None = None,
        notification_service: NotificationService | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc."""
        super().__init__(repository or SystemAnnouncementRepository())
        self.user_repository = user_repository or UserRepository()
        self.notification_service = notification_service or NotificationService()

    @transaction.atomic
    def create(self, actor: Any, data: dict[str, Any]) -> SystemAnnouncement:
        """Lưu rồi phát tới đối tượng đã chọn."""
        data = dict(data)
        role_ids = data.pop("role_ids", [])
        announcement = self.repository.create(actor=actor, **data)
        if announcement.target == SystemAnnouncement.Target.ROLES:
            announcement.roles.set(role_ids)
            users = list(self.user_repository.active_in_roles(role_ids))
        else:
            users = list(self.user_repository.active_with_permission(None))
        count = self.notification_service.notify(
            EVENT,
            dedup_key=f"announcement:{announcement.pk}",
            recipients=users,
            payload=NotificationPayload(
                title=announcement.title,
                body=announcement.body,
                link=announcement.link,
                level=announcement.level,
                expires_at=announcement.expires_at,
            ),
        )
        return self.repository.update(
            announcement, actor=actor, sent_at=timezone.now(), recipient_count=count
        )

    @transaction.atomic
    def delete(self, actor: Any, pk: Any) -> None:
        """Thu hồi: xóa thông báo đã tách cho từng người rồi xóa mềm bản ghi."""
        announcement = self.get_for_write(actor, pk)
        self.notification_service.revoke(EVENT, f"announcement:{announcement.pk}")
        self.repository.delete(announcement, actor=actor)
