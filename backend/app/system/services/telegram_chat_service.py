"""Nơi nhận Telegram của từng người: mã 10 phút → link `startgroup`/`start` của bot riêng → Kiểm tra
(getUpdates + getChatMember) → gửi thử."""

import secrets
from datetime import timedelta
from typing import Any

from django.db import transaction
from django.utils import timezone

from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.exceptions.not_found_error import NotFoundError
from app.core.services.core_crud_service import CoreCrudService
from app.system.constants.notification_defaults import TELEGRAM_REGISTRATION_MINUTES
from app.system.constants.notification_error_code import NotificationErrorCode
from app.system.models.telegram_chat import TelegramChat
from app.system.permissions.telegram_chat_permission import TelegramChatPermission
from app.system.repositories.telegram_chat_repository import TelegramChatRepository
from app.system.services.telegram_bot_service import TelegramBotService
from app.system.services.telegram_client import TelegramClient
from app.system.types.telegram_send_result import TelegramSendResult

Status = TelegramChat.Status
SENDER_ROLES = ("administrator", "member", "creator")
CODE_LENGTH = 12
LINK_KINDS = {"group": "startgroup", "private": "start"}


class TelegramChatService(CoreCrudService[TelegramChat, TelegramChatRepository]):
    """Không nhận chat id nhập tay chưa xác minh; chỉ chủ (hoặc `manage_all`) thấy chat."""

    repository_class = TelegramChatRepository
    owner_field = "owner"
    manage_all_permission = TelegramChatPermission.MANAGE_ALL.code

    def __init__(
        self,
        repository: TelegramChatRepository | None = None,
        client: TelegramClient | None = None,
        telegram_bot_service: TelegramBotService | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc."""
        super().__init__(repository or TelegramChatRepository())
        self.client = client or TelegramClient()
        self.telegram_bot_service = telegram_bot_service or TelegramBotService(client=self.client)

    @transaction.atomic
    def start_registration(self, actor: Any, kind: str) -> dict[str, Any]:
        """Tạo bản chờ với mã; trả link thêm bot vào nhóm (`group`) hoặc chat riêng (`private`)."""
        bot = self.telegram_bot_service.require_for(actor)
        code = secrets.token_urlsafe(9).replace("-", "").replace("_", "")[:CODE_LENGTH]
        chat = self.repository.create(
            actor=actor,
            owner=actor,
            bot=bot,
            registration_code=code,
            registration_expires_at=timezone.now() + timedelta(minutes=TELEGRAM_REGISTRATION_MINUTES),
        )
        parameter = LINK_KINDS.get(kind, LINK_KINDS["group"])
        return {"chat": chat, "code": code, "link": f"https://t.me/{bot.username}?{parameter}={code}"}

    @transaction.atomic
    def verify(self, actor: Any, pk: Any) -> TelegramChat:
        """Tìm `/start <mã>` trong getUpdates của bot, xác minh quyền gửi, gửi tin thử."""
        chat = self.get_for_write(actor, pk)
        if chat.owner_id != actor.pk:
            raise NotFoundError()
        if chat.status != Status.PENDING or not chat.registration_code:
            return chat
        if chat.registration_expires_at and chat.registration_expires_at < timezone.now():
            raise BusinessRuleError(
                "Mã đăng ký đã hết hạn, hãy tạo mã mới.",
                code=NotificationErrorCode.TELEGRAM_REGISTRATION_EXPIRED,
            )
        token = self.telegram_bot_service.token_of(chat.bot)
        found = self._find_registration(token, chat.registration_code)
        if found is None:
            raise BusinessRuleError(
                "Chưa thấy bot nhận mã này.", code=NotificationErrorCode.TELEGRAM_REGISTRATION_NOT_FOUND
            )
        if found.get("type") != "private":
            member = self.client.get_chat_member(token, str(found["id"]), int(chat.bot.bot_id))
            if member.get("status") not in SENDER_ROLES:
                raise BusinessRuleError(
                    "Bot không có quyền gửi trong nhóm.", code=NotificationErrorCode.TELEGRAM_CHAT_INACTIVE
                )
        existing = self.repository.find_one(bot_id=chat.bot_id, chat_id=str(found["id"]))
        target = existing or chat
        updated = self.repository.update(
            target,
            actor=actor,
            chat_id=str(found["id"]),
            title=found.get("title") or found.get("username") or found.get("first_name") or "",
            chat_type=found.get("type", ""),
            status=Status.ACTIVE,
            is_active=True,
            registration_code=None,
            registration_expires_at=None,
            last_verified_at=timezone.now(),
            last_error_code="",
        )
        if existing is not None and existing.pk != chat.pk:
            self.repository.hard_delete(chat)
        self.client.send_message(
            token, str(updated.chat_id), "✅ Đã kết nối với ToanNX. Thông báo sẽ gửi vào đây."
        )
        return updated

    def send_test(self, actor: Any, pk: Any) -> TelegramChat:
        """Gửi tin thử và cập nhật trạng thái theo kết quả."""
        chat = self.get_by_id_for(actor, pk)
        if chat.owner_id != actor.pk:
            raise NotFoundError()
        if not chat.chat_id:
            raise BusinessRuleError("Chat chưa xác minh.", code=NotificationErrorCode.TELEGRAM_CHAT_INACTIVE)
        token = self.telegram_bot_service.token_of(chat.bot)
        return self.apply_send_result(
            chat, self.client.send_message(token, chat.chat_id, "🔔 Tin thử từ ToanNX.")
        )

    def verified_for(self, actor: Any) -> list[TelegramChat]:
        """Chat đã xác minh, đang bật của actor (dùng cho tùy chọn thông báo)."""
        return list(self.repository.filter(owner_id=actor.pk, status=Status.ACTIVE, is_active=True))

    def apply_send_result(self, chat: TelegramChat, result: TelegramSendResult) -> TelegramChat:
        """403 → bot bị xóa khỏi chat; nâng supergroup → đổi chat id; lỗi khác → không gửi được."""
        if result.ok:
            return self.repository.update(
                chat, status=Status.ACTIVE, last_error_code="", last_verified_at=timezone.now()
            )
        if result.migrate_to_chat_id:
            return self.repository.update(
                chat, chat_id=result.migrate_to_chat_id, last_error_code=result.error_code
            )
        status = Status.REMOVED if result.error_code == "TELEGRAM_403" else Status.UNREACHABLE
        return self.repository.update(chat, status=status, last_error_code=result.error_code)

    def _find_registration(self, token: str, code: str) -> dict[str, Any] | None:
        for update in reversed(self.client.get_updates(token)):
            message = update.get("message") or {}
            text = str(message.get("text") or "")
            if text.startswith("/start") and code in text:
                return message.get("chat") or None
        return None
