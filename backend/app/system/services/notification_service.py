"""Điểm vào DUY NHẤT để phát thông báo: `notify(...)`.

Trong transaction nghiệp vụ chỉ ghi DB (savepoint riêng, lỗi chỉ ghi log, không ném ra nơi gọi). **Request
không bao giờ gọi FCM/SMTP/Telegram**: sau commit chỉ "đá" `NotificationKickService` (QStash gọi lại endpoint
dispatch ở lượt function riêng); cron ngoài là lưới an toàn và không chạm DB khi không có việc.
Module khác chỉ gọi `notify`, không tự gửi email/Telegram/push và không đọc model thông báo.
"""

import logging
import time
from collections import defaultdict
from datetime import timedelta
from typing import Any

from django.core.exceptions import ImproperlyConfigured
from django.db import transaction
from django.db.models import QuerySet
from django.utils import timezone

from app.core.exceptions.not_found_error import NotFoundError
from app.core.registry.module_registry import ModuleRegistry, module_registry
from app.core.registry.notification_event_definition import NotificationEventDefinition
from app.system.constants.notification_channel import NotificationChannel
from app.system.constants.notification_defaults import (
    NOTIFICATION_BULK_BATCH,
    NOTIFICATION_CRON_BATCH,
    NOTIFICATION_CRON_BUDGET_SECONDS,
    NOTIFICATION_DELIVERY_RETENTION_DAYS,
    NOTIFICATION_READ_RETENTION_DAYS,
    NOTIFICATION_RETENTION_DAYS,
    PUSH_DEVICE_STALE_DAYS,
)
from app.system.constants.notification_error_code import NotificationErrorCode
from app.system.constants.notification_level import NotificationLevel
from app.system.constants.system_notification_event import SystemNotificationEvent
from app.system.models.notification import Notification
from app.system.models.notification_delivery import NotificationDelivery
from app.system.repositories.notification_delivery_repository import NotificationDeliveryRepository
from app.system.repositories.notification_repository import NotificationRepository
from app.system.repositories.push_device_repository import PushDeviceRepository
from app.system.repositories.user_repository import UserRepository
from app.system.services.notification_dispatcher import NotificationDispatcher
from app.system.services.notification_kick_service import NotificationKickService
from app.system.services.notification_preference_service import NotificationPreferenceService
from app.system.services.push_device_service import PushDeviceService
from app.system.types.notification_payload import NotificationPayload

logger = logging.getLogger(__name__)
Channel = NotificationChannel
# Lỗi vĩnh viễn nhưng bình thường, hệ thống đã tự xử lý (token trình duyệt hết hạn → thiết bị bị tắt):
# không cảnh báo "gửi thất bại" cho quản trị viên.
SILENT_FAILURE_CODES = frozenset({NotificationErrorCode.PUSH_TOKEN_INVALID})


class NotificationService:
    """Tạo thông báo + outbox, gửi sau commit, đọc chuông, dọn dẹp."""

    def __init__(
        self,
        repository: NotificationRepository | None = None,
        delivery_repository: NotificationDeliveryRepository | None = None,
        user_repository: UserRepository | None = None,
        push_device_repository: PushDeviceRepository | None = None,
        preference_service: NotificationPreferenceService | None = None,
        dispatcher: NotificationDispatcher | None = None,
        registry: ModuleRegistry | None = None,
        kick_service: NotificationKickService | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc."""
        self.repository = repository or NotificationRepository()
        self.delivery_repository = delivery_repository or NotificationDeliveryRepository()
        self.user_repository = user_repository or UserRepository()
        self.push_device_repository = push_device_repository or PushDeviceRepository()
        self.preference_service = preference_service or NotificationPreferenceService()
        self.dispatcher = dispatcher or NotificationDispatcher()
        self.registry = registry or module_registry
        self.push_device_service = PushDeviceService(self.push_device_repository)
        self.kick_service = kick_service or NotificationKickService()
        self._kick_scheduled = False
        self._pending_kick = False

    # ================================================================== phát
    def notify(
        self,
        event_code: str,
        *,
        dedup_key: str,
        payload: NotificationPayload,
        recipient: Any | None = None,
        recipients: list[Any] | None = None,
        kick: bool = True,
    ) -> int:
        """Tạo thông báo cho người nhận của sự kiện; sau commit đá việc gửi (không gửi trong request).

        Args:
            event_code: Mã sự kiện đã khai trong `ModuleDescriptor.notification_events`.
            dedup_key: Khóa chống trùng (cùng người + sự kiện + khóa thì không tạo lại).
            payload: Nội dung.
            recipient: Người nhận (bắt buộc với sự kiện `OWNER` nếu không truyền `recipients`).
            recipients: Danh sách người nhận do nơi gọi chọn (thông báo hệ thống theo vai trò).
            kick: True để tự đá `NotificationKickService` sau commit; False để gom chờ gọi `flush_kick()`.

        Returns:
            Số thông báo mới tạo (0 khi lỗi: lỗi không bao giờ ném ra nơi gọi).

        Raises:
            ImproperlyConfigured: Sự kiện chưa khai hoặc thiếu người nhận (lỗi lập trình).
        """
        event = self.registry.find_notification_event(event_code)
        if event is None:
            raise ImproperlyConfigured(f"Sự kiện thông báo chưa khai: {event_code!r}")
        if event.audience == "OWNER" and recipient is None and recipients is None:
            raise ImproperlyConfigured(f"Sự kiện {event_code!r} (OWNER) phải truyền recipient.")
        try:
            with transaction.atomic():
                users = self._recipients(event, recipient, recipients)
                created, delivery_ids = self._create(event, users, dedup_key, payload)
        except Exception:  # noqa: BLE001 - thông báo lỗi không được làm hỏng nghiệp vụ gọi nó
            logger.exception("notification.notify_failed %s", event_code)
            return 0
        if delivery_ids:
            if kick:
                self._schedule_kick()
            else:
                self._pending_kick = True
        return created

    def flush_kick(self) -> bool:
        """Đá hàng đợi gửi thông báo một lần cho các lượt `notify(..., kick=False)` trước đó."""
        if not self._pending_kick:
            return False
        self._pending_kick = False
        if transaction.get_connection().in_atomic_block:
            self._schedule_kick()
        else:
            self._kick_scheduled = False
            self.kick_service.kick()
        return True

    def revoke(self, event_code: str, dedup_key: str) -> int:
        """Thu hồi thông báo đã phát (xóa khỏi chuông mọi người)."""
        return self.repository.hard_delete_where(event_code=event_code, dedup_key=dedup_key)

    # ================================================================== gửi
    def dispatch_ids(self, ids: list[Any], budget_seconds: float) -> int:
        """Gửi lần lượt trong ngân sách thời gian; hết giờ thì để lượt sau gửi nốt."""
        deadline = time.monotonic() + budget_seconds
        sent = 0
        for pk in ids:
            if time.monotonic() >= deadline:
                break
            sent += self._send_and_alert(pk)
        return sent

    def dispatch_pending(self, *, force: bool = False) -> int:
        """Gửi các bản đến hạn (tối đa một lô, trong ngân sách cron).

        Args:
            force: Bỏ qua mốc trong Redis (lượt QStash gọi lại, cron dọn dẹp hằng ngày).

        Returns:
            Số bản gửi thành công; 0 và **không query DB** khi mốc trong Redis chưa tới.
        """
        if not force and not self.kick_service.has_due_work():
            return 0
        marker = self.kick_service.read_marker()
        sent = self.dispatch_ids(
            self.dispatcher.due_ids(NOTIFICATION_CRON_BATCH), NOTIFICATION_CRON_BUDGET_SECONDS
        )
        self.kick_service.remember_next_due(self.dispatcher.next_due_at(), marker)
        return sent

    def retry(self, delivery: NotificationDelivery) -> NotificationDelivery | None:
        """Nút Gửi lại: đưa về PENDING, cho thêm một lần thử."""
        with transaction.atomic():
            self.delivery_repository.update(
                delivery, status=NotificationDelivery.Status.PENDING, attempts=0, next_attempt_at=None
            )
        self._send_and_alert(delivery.pk)
        return self.delivery_repository.find_by_id(delivery.pk)

    # ================================================================== chuông
    def list_for(self, actor: Any, scope: str | None, unread: bool) -> QuerySet[Notification]:
        """Thông báo của actor theo tab."""
        queryset = self.repository.visible_for(actor.pk)
        if scope:
            queryset = queryset.filter(scope=scope)
        if unread:
            queryset = queryset.filter(read_at__isnull=True)
        return queryset

    def unread_counts(self, actor: Any) -> dict[str, int]:
        """Số chưa đọc theo tab."""
        return self.repository.unread_counts(actor.pk)

    def mark_read(self, actor: Any, pk: Any) -> Notification:
        """Đánh dấu một thông báo của actor đã đọc."""
        notification = self._own(actor, pk)
        if notification.read_at is None:
            notification = self.repository.update(notification, read_at=timezone.now())
        return notification

    def mark_all_read(self, actor: Any, scope: str | None) -> int:
        """Đánh dấu đã đọc tất cả (theo tab)."""
        filters: dict[str, Any] = {"recipient_id": actor.pk, "read_at__isnull": True}
        if scope:
            filters["scope"] = scope
        return self.repository.update_where({"read_at": timezone.now()}, **filters)

    def hide(self, actor: Any, pk: Any) -> None:
        """Ẩn khỏi chuông (xóa cứng thông báo của chính mình)."""
        self.repository.hard_delete(self._own(actor, pk))

    # ================================================================== dọn dẹp
    def cleanup(self) -> int:
        """Xóa thông báo đã đọc quá 90 ngày, mọi thông báo quá 180 ngày, outbox quá 30 ngày, thiết bị cũ."""
        now = timezone.now()
        removed = self.repository.hard_delete_where(
            read_at__lt=now - timedelta(days=NOTIFICATION_READ_RETENTION_DAYS)
        )
        removed += self.repository.hard_delete_where(
            created_at__lt=now - timedelta(days=NOTIFICATION_RETENTION_DAYS)
        )
        removed += self.delivery_repository.hard_delete_where(
            created_at__lt=now - timedelta(days=NOTIFICATION_DELIVERY_RETENTION_DAYS)
        )
        removed += self.push_device_service.cleanup_stale(now - timedelta(days=PUSH_DEVICE_STALE_DAYS))
        return removed

    # ================================================================== nội bộ
    def _schedule_kick(self) -> None:
        """Đá việc gửi một lần sau commit, dù request tạo nhiều thông báo."""
        if self._kick_scheduled:
            return
        self._kick_scheduled = True

        def run() -> None:
            self._kick_scheduled = False
            self.kick_service.kick()

        transaction.on_commit(run)

    def _own(self, actor: Any, pk: Any) -> Notification:
        notification = self.repository.find_by_id(pk)
        if notification is None or notification.recipient_id != actor.pk:
            raise NotFoundError()
        return notification

    def _recipients(
        self, event: NotificationEventDefinition, recipient: Any | None, recipients: list[Any] | None
    ) -> list[Any]:
        """Người nhận đang hoạt động, còn quyền của sự kiện."""
        if recipients is not None:
            candidates = list(recipients)
        elif recipient is not None:
            candidates = [recipient]
        else:
            return list(self.user_repository.active_with_permission(event.permission))
        return [
            user
            for user in candidates
            if user.is_active and (event.permission is None or user.has_perm(event.permission))
        ]

    def _create(
        self,
        event: NotificationEventDefinition,
        users: list[Any],
        dedup_key: str,
        payload: NotificationPayload,
    ) -> tuple[int, list[Any]]:
        if not users:
            return 0, []
        existing = self.repository.existing_recipient_ids(event.code, dedup_key, [user.pk for user in users])
        users = [user for user in users if user.pk not in existing]
        level = payload.level or event.default_level
        resolved_map = self.preference_service.resolve(users, event, level)
        now = timezone.now()
        notifications: list[Notification] = []
        for user in users:
            resolved = resolved_map[user.pk]
            if not resolved.any:
                continue
            notifications.append(
                Notification(
                    recipient=user,
                    scope=event.scope,
                    level=level,
                    event_code=event.code,
                    module=event.module,
                    title=payload.title[:200],
                    body=payload.body,
                    message_key=payload.message_key,
                    params=payload.params,
                    link=payload.link,
                    data={**payload.data, "details": [list(row) for row in payload.details]}
                    if payload.details
                    else payload.data,
                    dedup_key=dedup_key[:200],
                    # Tắt IN_APP: vẫn cần bản ghi làm nội dung cho email/Telegram/push nhưng ẩn khỏi chuông.
                    expires_at=payload.expires_at if resolved.in_app else now,
                )
            )
        created: list[Notification] = []
        for start in range(0, len(notifications), NOTIFICATION_BULK_BATCH):
            created.extend(
                self.repository.bulk_create(notifications[start : start + NOTIFICATION_BULK_BATCH])
            )
        deliveries = self._deliveries(created, resolved_map)
        self.delivery_repository.bulk_create(deliveries)
        return len(created), [delivery.pk for delivery in deliveries]

    def _deliveries(
        self, notifications: list[Notification], channels: dict[Any, Any]
    ) -> list[NotificationDelivery]:
        push_targets: dict[Any, list[Any]] = defaultdict(list)
        if self.push_device_service.is_configured():
            user_ids = [item.recipient_id for item in notifications if channels[item.recipient_id].push]
            for device in self.push_device_repository.active_for_users(user_ids):
                push_targets[device.user_id].append(device.pk)
        deliveries: list[NotificationDelivery] = []
        for notification in notifications:
            resolved = channels[notification.recipient_id]
            targets: list[tuple[str, str]] = [
                (Channel.PUSH, str(pk)) for pk in push_targets[notification.recipient_id]
            ]
            if resolved.email:
                targets.append((Channel.EMAIL, notification.recipient.email))
            targets.extend((Channel.TELEGRAM, str(chat_id)) for chat_id in resolved.chat_ids)
            deliveries.extend(
                NotificationDelivery(notification=notification, channel=channel, target=target)
                for channel, target in targets
            )
        return deliveries

    def _send_and_alert(self, pk: Any) -> int:
        """Gửi một bản; chuyển FAILED thì phát cảnh báo hệ thống (gom theo giờ, không cảnh báo chính nó)."""
        try:
            delivery = self.dispatcher.send(pk)
        except Exception:  # noqa: BLE001 - một bản lỗi không chặn các bản sau
            logger.exception("Gửi thông báo %s lỗi", pk)
            return 0
        if delivery is None:
            return 0
        if delivery.status == NotificationDelivery.Status.PENDING and delivery.next_attempt_at is not None:
            # Lỗi tạm: hẹn QStash gọi lại đúng lúc thử lại theo lùi dần.
            delay = (delivery.next_attempt_at - timezone.now()).total_seconds()
            self.kick_service.kick(int(max(0, delay)) + 1)
        if (
            delivery.status == NotificationDelivery.Status.FAILED
            and delivery.notification.event_code != SystemNotificationEvent.DELIVERY_FAILED
            and delivery.last_error_code not in SILENT_FAILURE_CODES
        ):
            now = timezone.now()
            self.notify(
                SystemNotificationEvent.DELIVERY_FAILED,
                dedup_key=f"{now:%Y%m%d%H}",
                payload=NotificationPayload(
                    title="Có thông báo gửi thất bại",
                    body=f"Kênh {delivery.channel}, lỗi {delivery.last_error_code}.",
                    level=NotificationLevel.ERROR,
                    message_key="system.notifications.events.deliveryFailed",
                    details=(
                        ("📡 Kênh", str(delivery.channel)),
                        ("❗ Mã lỗi", delivery.last_error_code or "-"),
                        ("📨 Sự kiện", delivery.notification.event_code),
                        ("🔁 Số lần thử", str(delivery.attempts)),
                    ),
                ),
            )
        return int(delivery.status == NotificationDelivery.Status.SENT)
