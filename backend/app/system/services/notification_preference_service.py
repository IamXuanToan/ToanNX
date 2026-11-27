"""Tùy chọn nhận thông báo: sự kiện người dùng được nhận, ma trận sự kiện × kênh, áp mặc định khi gửi."""

from collections import defaultdict
from typing import Any

from django.db import transaction

from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.registry.module_registry import ModuleRegistry, module_registry
from app.core.registry.notification_event_definition import NotificationEventDefinition
from app.system.constants.notification_channel import NotificationChannel
from app.system.constants.notification_error_code import NotificationErrorCode
from app.system.constants.notification_level import NotificationLevel
from app.system.models.notification_preference import NotificationPreference
from app.system.models.telegram_chat import TelegramChat
from app.system.permissions.telegram_chat_permission import TelegramChatPermission
from app.system.repositories.notification_preference_repository import NotificationPreferenceRepository
from app.system.repositories.telegram_chat_repository import TelegramChatRepository
from app.system.services.push_device_service import PushDeviceService
from app.system.services.telegram_bot_service import TelegramBotService
from app.system.types.resolved_channels import ResolvedChannels

Channel = NotificationChannel
SIMPLE_CHANNELS = (Channel.IN_APP, Channel.PUSH, Channel.EMAIL)


class NotificationPreferenceService:
    """Không có dòng tùy chọn thì dùng `default_channels` của sự kiện; sự kiện ERROR luôn có IN_APP."""

    def __init__(
        self,
        repository: NotificationPreferenceRepository | None = None,
        telegram_chat_repository: TelegramChatRepository | None = None,
        push_device_service: PushDeviceService | None = None,
        registry: ModuleRegistry | None = None,
        telegram_bot_service: TelegramBotService | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc."""
        self.repository = repository or NotificationPreferenceRepository()
        self.telegram_chat_repository = telegram_chat_repository or TelegramChatRepository()
        self.push_device_service = push_device_service or PushDeviceService()
        self.registry = registry or module_registry
        self.telegram_bot_service = telegram_bot_service or TelegramBotService()

    # ------------------------------------------------------------------ đọc
    def events_for(self, actor: Any) -> list[NotificationEventDefinition]:
        """Sự kiện actor được nhận (có quyền của sự kiện, hoặc sự kiện không cần quyền)."""
        return [
            event
            for event in self.registry.notification_event_definitions()
            if event.permission is None or actor.has_perm(event.permission)
        ]

    def available_channels(self, actor: Any) -> list[str]:
        """Kênh actor dùng được: PUSH khi đã cấu hình Firebase, TELEGRAM khi có quyền + chat đã xác minh."""
        channels = [Channel.IN_APP.value, Channel.EMAIL.value]
        if self.push_device_service.is_configured():
            channels.insert(1, Channel.PUSH.value)
        if (
            self.telegram_bot_service.is_configured()
            and actor.has_perm(TelegramChatPermission.READ.code)
            and self._verified_chats(actor.pk)
        ):
            channels.append(Channel.TELEGRAM.value)
        return channels

    def matrix(self, actor: Any) -> list[dict[str, Any]]:
        """Ma trận sự kiện × kênh đang áp dụng cho actor (đã gộp mặc định)."""
        events = self.events_for(actor)
        resolved = {event.code: self._resolve_one(actor.pk, event) for event in events}
        return [
            {
                "event": event,
                "in_app": resolved[event.code].in_app,
                "push": resolved[event.code].push,
                "email": resolved[event.code].email,
                "telegram_chat_ids": resolved[event.code].chat_ids,
                "in_app_locked": event.default_level == NotificationLevel.ERROR,
            }
            for event in events
        ]

    # ------------------------------------------------------------------ ghi
    @transaction.atomic
    def update(self, actor: Any, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Đồng bộ tùy chọn của actor theo danh sách gửi lên (mỗi sự kiện một mục).

        Raises:
            BusinessRuleError: Sự kiện không có quyền, tắt IN_APP của sự kiện ERROR, chat không hợp lệ.
        """
        allowed = {event.code: event for event in self.events_for(actor)}
        chats = {str(chat.pk) for chat in self._verified_chats(actor.pk)}
        rows: list[NotificationPreference] = []
        for item in items:
            event = allowed.get(item["event_code"])
            if event is None:
                raise BusinessRuleError(
                    "Không được nhận sự kiện này.", code=NotificationErrorCode.EVENT_FORBIDDEN
                )
            if event.default_level == NotificationLevel.ERROR and not item.get("in_app", True):
                raise BusinessRuleError(
                    "Sự kiện lỗi luôn hiện trong ứng dụng.", code=NotificationErrorCode.IN_APP_REQUIRED
                )
            chat_ids = [str(chat_id) for chat_id in item.get("telegram_chat_ids", [])]
            if any(chat_id not in chats for chat_id in chat_ids):
                raise BusinessRuleError(
                    "Chat Telegram không hợp lệ.", code=NotificationErrorCode.CHAT_INVALID
                )
            for channel in SIMPLE_CHANNELS:
                rows.append(
                    NotificationPreference(
                        user=actor,
                        event_code=event.code,
                        channel=channel,
                        is_enabled=bool(item.get(channel.lower(), False)),
                    )
                )
            # Có dòng TELEGRAM (kể cả rỗng nghĩa là tắt) thì không còn dùng mặc định cho Telegram.
            rows.append(
                NotificationPreference(
                    user=actor, event_code=event.code, channel=Channel.TELEGRAM, is_enabled=False
                )
            )
            rows.extend(
                NotificationPreference(
                    user=actor,
                    event_code=event.code,
                    channel=Channel.TELEGRAM,
                    telegram_chat_id=chat_id,
                    is_enabled=True,
                )
                for chat_id in chat_ids
            )
        self.repository.hard_delete_where(
            user_id=actor.pk, event_code__in=[item["event_code"] for item in items]
        )
        self.repository.bulk_create(rows, actor=actor)
        return self.matrix(actor)

    # ------------------------------------------------------------------ gửi
    def resolve(
        self, users: list[Any], event: NotificationEventDefinition, level: str
    ) -> dict[Any, ResolvedChannels]:
        """Kênh của từng người cho một sự kiện (2 truy vấn cho cả danh sách).

        Args:
            users: Người nhận.
            event: Định nghĩa sự kiện.
            level: Mức thực tế của thông báo (ERROR thì luôn có IN_APP).

        Returns:
            Map user id → kênh.
        """
        user_ids = [user.pk for user in users]
        rows: dict[Any, list[NotificationPreference]] = defaultdict(list)
        for row in self.repository.for_users(user_ids, event.code):
            rows[row.user_id].append(row)
        # Chỉ chat đã xác minh và còn bật khi Bot chung đã cấu hình.
        active_chats: dict[Any, list[Any]] = defaultdict(list)
        if self.telegram_bot_service.is_configured():
            for chat in self.telegram_chat_repository.filter(
                owner_id__in=user_ids, status=TelegramChat.Status.ACTIVE, is_active=True
            ):
                active_chats[chat.owner_id].append(chat.pk)
        result: dict[Any, ResolvedChannels] = {}
        for user in users:
            chats = active_chats.get(user.pk, [])
            default_chats = chats if Channel.TELEGRAM in event.default_channels else []
            resolved = self._merge(event, rows.get(user.pk, []), default_chats)
            allowed = {str(chat_id) for chat_id in chats}
            resolved.chat_ids = [chat_id for chat_id in resolved.chat_ids if str(chat_id) in allowed]
            if level == NotificationLevel.ERROR:
                resolved.in_app = True
            if not user.email:
                resolved.email = False
            result[user.pk] = resolved
        return result

    def _resolve_one(self, user_id: Any, event: NotificationEventDefinition) -> ResolvedChannels:
        rows = list(self.repository.for_users([user_id], event.code))
        chats = (
            [chat.pk for chat in self._verified_chats(user_id)]
            if Channel.TELEGRAM in event.default_channels
            else []
        )
        resolved = self._merge(event, rows, chats)
        if event.default_level == NotificationLevel.ERROR:
            resolved.in_app = True
        return resolved

    def _merge(
        self, event: NotificationEventDefinition, rows: list[NotificationPreference], default_chats: list[Any]
    ) -> ResolvedChannels:
        explicit = {row.channel: row.is_enabled for row in rows if row.channel != Channel.TELEGRAM}
        telegram_rows = [row for row in rows if row.channel == Channel.TELEGRAM]

        def enabled(channel: str) -> bool:
            return explicit.get(channel, channel in event.default_channels)

        chat_ids = (
            [row.telegram_chat_id for row in telegram_rows if row.is_enabled and row.telegram_chat_id]
            if telegram_rows
            else list(default_chats)
        )
        return ResolvedChannels(
            in_app=enabled(Channel.IN_APP),
            push=enabled(Channel.PUSH),
            email=enabled(Channel.EMAIL),
            chat_ids=chat_ids,
        )

    def _verified_chats(self, user_id: Any) -> list[TelegramChat]:
        return list(
            self.telegram_chat_repository.filter(
                owner_id=user_id, status=TelegramChat.Status.ACTIVE, is_active=True
            )
        )
