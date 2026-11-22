"""Nhật ký gửi thông báo: của mình, hoặc mọi người với `manage_all`; gửi lại."""

from typing import Any

from django.db.models import QuerySet

from app.core.services.core_crud_service import CoreCrudService
from app.system.models.notification_delivery import NotificationDelivery
from app.system.permissions.notification_delivery_permission import NotificationDeliveryPermission
from app.system.repositories.notification_delivery_repository import NotificationDeliveryRepository
from app.system.services.notification_service import NotificationService


class NotificationDeliveryService(CoreCrudService[NotificationDelivery, NotificationDeliveryRepository]):
    """Chủ của một lần gửi là người nhận thông báo."""

    repository_class = NotificationDeliveryRepository
    manage_all_permission = NotificationDeliveryPermission.MANAGE_ALL.code

    def __init__(
        self,
        repository: NotificationDeliveryRepository | None = None,
        notification_service: NotificationService | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc."""
        super().__init__(repository or NotificationDeliveryRepository())
        self.notification_service = notification_service or NotificationService(
            delivery_repository=self.repository
        )

    def get_queryset_for(self, actor: Any) -> QuerySet[NotificationDelivery]:
        """Lần gửi của actor, hoặc tất cả với `manage_all`."""
        queryset = self.get_queryset()
        return (
            queryset if self.can_manage_all(actor) else queryset.filter(notification__recipient_id=actor.pk)
        )

    def can_manage_all(self, actor: Any) -> bool:
        """Có quyền xem mọi lần gửi."""
        return bool(actor.has_perm(self.manage_all_permission))

    def can_access(self, actor: Any, instance: NotificationDelivery) -> bool:
        """Người nhận hoặc `manage_all`."""
        return instance.notification.recipient_id == actor.pk or self.can_manage_all(actor)

    def get_owner_id(self, instance: NotificationDelivery) -> Any:
        """Chủ là người nhận thông báo."""
        return instance.notification.recipient_id

    def retry(self, actor: Any, pk: Any) -> NotificationDelivery | None:
        """Gửi lại một lần gửi actor được thấy."""
        return self.notification_service.retry(self.get_by_id_for(actor, pk))
