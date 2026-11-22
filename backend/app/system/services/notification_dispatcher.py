"""Gửi một bản outbox qua kênh của nó (PUSH/EMAIL/TELEGRAM); khóa dòng `skip_locked` để cron và request không
gửi trùng. Không phụ thuộc `NotificationService` (tránh vòng lặp): cảnh báo gửi lỗi do service gọi xử lý."""

import html
import logging
from datetime import timedelta
from typing import Any

from django.db import transaction
from django.utils import timezone

from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.registry.module_registry import ModuleRegistry, module_registry
from app.system.constants.notification_channel import NotificationChannel
from app.system.constants.notification_defaults import (
    NOTIFICATION_MAX_ATTEMPTS,
    NOTIFICATION_RETRY_BACKOFF_MINUTES,
    TELEGRAM_MESSAGE_MAX_LENGTH,
)
from app.system.constants.notification_error_code import NotificationErrorCode
from app.system.models.notification import Notification
from app.system.models.notification_delivery import NotificationDelivery
from app.system.models.telegram_chat import TelegramChat
from app.system.repositories.notification_delivery_repository import NotificationDeliveryRepository
from app.system.repositories.push_device_repository import PushDeviceRepository
from app.system.repositories.telegram_chat_repository import TelegramChatRepository
from app.system.services.email_service import EmailService
from app.system.services.fcm_client import FcmClient
from app.system.services.push_device_service import PushDeviceService
from app.system.services.telegram_bot_service import TelegramBotService
from app.system.services.telegram_chat_service import TelegramChatService
from app.system.services.telegram_client import TelegramClient
from app.system.utils.frontend_url import get_frontend_origin

logger = logging.getLogger(__name__)
Status = NotificationDelivery.Status
Channel = NotificationChannel
# Kết quả một lần gửi: (trạng thái mới, mã lỗi, id phía nhà cung cấp, lỗi vĩnh viễn?)
Outcome = tuple[str, str, str, bool]
TEMPORARY_TELEGRAM_ERRORS = ("TELEGRAM_429", NotificationErrorCode.TELEGRAM_UNAVAILABLE.value)


class NotificationDispatcher:
    """Một bản = một lần gọi dịch vụ ngoài (timeout 3 giây); lỗi tạm thì lùi dần 1/5/15/60/240 phút."""

    def __init__(
        self,
        repository: NotificationDeliveryRepository | None = None,
        push_device_repository: PushDeviceRepository | None = None,
        telegram_chat_repository: TelegramChatRepository | None = None,
        fcm_client: FcmClient | None = None,
        telegram_client: TelegramClient | None = None,
        email_service: EmailService | None = None,
        registry: ModuleRegistry | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc."""
        self.repository = repository or NotificationDeliveryRepository()
        self.push_device_repository = push_device_repository or PushDeviceRepository()
        self.telegram_chat_repository = telegram_chat_repository or TelegramChatRepository()
        self.fcm_client = fcm_client or FcmClient()
        self.telegram_client = telegram_client or TelegramClient()
        self.email_service = email_service or EmailService()
        self.registry = registry or module_registry
        self.push_device_service = PushDeviceService(self.push_device_repository, self.fcm_client)
        self.telegram_bot_service = TelegramBotService(client=self.telegram_client)
        self.telegram_chat_service = TelegramChatService(
            self.telegram_chat_repository, self.telegram_client, self.telegram_bot_service
        )

    def send(self, pk: Any) -> NotificationDelivery | None:
        """Gửi một bản còn PENDING (đang bị tiến trình khác giữ thì bỏ qua).

        Returns:
            Bản sau khi cập nhật; None nếu không còn gì để gửi.
        """
        with transaction.atomic():
            delivery = self.repository.lock_pending(pk)
            if delivery is None:
                return None
            status, error_code, message_id, permanent = self._attempt(delivery)
            return self._record(delivery, status, error_code, message_id, permanent)

    def due_ids(self, limit: int) -> list[Any]:
        """Id bản đến hạn gửi."""
        return self.repository.due_ids(timezone.now(), NOTIFICATION_MAX_ATTEMPTS, limit)

    def _attempt(self, delivery: NotificationDelivery) -> Outcome:
        notification = delivery.notification
        skip = self._skip_reason(notification)
        if skip:
            return Status.SKIPPED, skip, "", True
        try:
            if delivery.channel == Channel.PUSH:
                return self._push(delivery, notification)
            if delivery.channel == Channel.EMAIL:
                return self._email(delivery, notification)
            return self._telegram(delivery, notification)
        except Exception:  # noqa: BLE001 - lỗi nhà cung cấp ghi vào outbox để thử lại, không làm hỏng cron
            logger.exception("Gửi thông báo %s lỗi", delivery.pk)
            return Status.PENDING, NotificationErrorCode.SEND_FAILED, "", False

    def _skip_reason(self, notification: Notification) -> str:
        """Người nhận bị khóa hoặc đã mất quyền của sự kiện → bỏ qua."""
        user = notification.recipient
        if not user.is_active:
            return NotificationErrorCode.RECIPIENT_INACTIVE
        event = self.registry.find_notification_event(notification.event_code)
        if event is not None and event.permission and not user.has_perm(event.permission):
            return NotificationErrorCode.PERMISSION_REVOKED
        return ""

    def _push(self, delivery: NotificationDelivery, notification: Notification) -> Outcome:
        device = self.push_device_repository.find_by_id(delivery.target)
        if device is None or not device.is_active or device.user_id != notification.recipient_id:
            return Status.SKIPPED, NotificationErrorCode.PUSH_TOKEN_INVALID, "", True
        result = self.fcm_client.send(
            device.fcm_token,
            {
                "notification_id": str(notification.pk),
                "scope": notification.scope,
                "level": notification.level,
                "title": notification.title,
                "body": notification.body[:500],
                "link": notification.link,
            },
        )
        if result.ok:
            return Status.SENT, "", result.message_id, False
        if result.permanent:
            self.push_device_service.deactivate(device.pk)
        return (
            (Status.FAILED if result.permanent else Status.PENDING),
            result.error_code,
            "",
            result.permanent,
        )

    def _email(self, delivery: NotificationDelivery, notification: Notification) -> Outcome:
        link = self._absolute(notification.link)
        text = f"{notification.body}\n\nXem chi tiết: {link}" if link else notification.body
        ok = self.email_service.send_now(
            subject=notification.title, recipient=delivery.target, text_body=text
        )
        if ok:
            return Status.SENT, "", "", False
        return Status.PENDING, NotificationErrorCode.EMAIL_FAILED, "", False

    def _telegram(self, delivery: NotificationDelivery, notification: Notification) -> Outcome:
        chat = self.telegram_chat_repository.find_by_id(delivery.target)
        if chat is None or chat.owner_id != notification.recipient_id:
            return Status.SKIPPED, NotificationErrorCode.TELEGRAM_BOT_MISSING, "", True
        if not chat.bot.is_active:
            return Status.SKIPPED, NotificationErrorCode.TELEGRAM_BOT_MISSING, "", True
        if not chat.chat_id or not chat.is_active or chat.status != TelegramChat.Status.ACTIVE:
            return Status.SKIPPED, NotificationErrorCode.TELEGRAM_CHAT_INACTIVE, "", True
        try:
            token = self.telegram_bot_service.token_of(chat.bot)
        except BusinessRuleError:
            return Status.FAILED, NotificationErrorCode.TELEGRAM_BOT_TOKEN_INVALID, "", True
        result = self.telegram_client.send_message(token, chat.chat_id, self._telegram_html(notification))
        if result.ok:
            self.telegram_chat_service.apply_send_result(chat, result)
            return Status.SENT, "", result.message_id, False
        if result.error_code == NotificationErrorCode.TELEGRAM_BOT_TOKEN_INVALID:
            self.telegram_bot_service.mark_token_invalid(chat.bot)
            return Status.FAILED, result.error_code, "", True
        self.telegram_chat_service.apply_send_result(chat, result)
        temporary = result.error_code in TEMPORARY_TELEGRAM_ERRORS or bool(result.migrate_to_chat_id)
        return (Status.PENDING if temporary else Status.FAILED), result.error_code, "", not temporary

    def _telegram_html(self, notification: Notification) -> str:
        parts = [f"<b>{html.escape(notification.title)}</b>"]
        if notification.body:
            parts.append(html.escape(notification.body))
        link = self._absolute(notification.link)
        if link:
            parts.append(f'<a href="{html.escape(link, quote=True)}">Xem chi tiết</a>')
        return "\n".join(parts)[:TELEGRAM_MESSAGE_MAX_LENGTH]

    def _absolute(self, path: str) -> str:
        """Link tuyệt đối cho email/Telegram (chạy ngoài request nên lấy origin FE từ cấu hình)."""
        if not path:
            return ""
        return f"{get_frontend_origin(None)}{path}"

    def _record(
        self, delivery: NotificationDelivery, status: str, error_code: str, message_id: str, permanent: bool
    ) -> NotificationDelivery:
        attempts = delivery.attempts + 1
        if status == Status.SENT:
            return self.repository.update(
                delivery,
                status=status,
                attempts=attempts,
                sent_at=timezone.now(),
                last_error_code="",
                provider_message_id=message_id,
            )
        if status == Status.PENDING and not permanent and attempts < NOTIFICATION_MAX_ATTEMPTS:
            backoff = NOTIFICATION_RETRY_BACKOFF_MINUTES[
                min(attempts, len(NOTIFICATION_RETRY_BACKOFF_MINUTES)) - 1
            ]
            return self.repository.update(
                delivery,
                status=Status.PENDING,
                attempts=attempts,
                last_error_code=error_code,
                next_attempt_at=timezone.now() + timedelta(minutes=backoff),
            )
        final = Status.SKIPPED if status == Status.SKIPPED else Status.FAILED
        return self.repository.update(delivery, status=final, attempts=attempts, last_error_code=error_code)
