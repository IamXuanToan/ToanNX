"""Nơi nhận Telegram của từng người: mã 10 phút → link `startgroup`/`start` bot chung → Webhook/Kiểm tra."""

import secrets
from datetime import timedelta
from typing import Any

from django.db import transaction
from django.utils import timezone

from app.core.exceptions.business_rule_error import BusinessRuleError
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
LEFT_STATUSES = frozenset({"left", "kicked"})


class TelegramChatService(CoreCrudService[TelegramChat, TelegramChatRepository]):
    """Không nhận chat id nhập tay chưa xác minh; chỉ chủ (hoặc `manage_all`) thấy và thao tác chat."""

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
        """Tạo bản chờ với mã; trả link thêm bot chung vào nhóm (`group`) hoặc chat riêng (`private`)."""
        bot = self.telegram_bot_service.bot_info()
        if not bot["configured"]:
            raise BusinessRuleError(
                "Chưa cấu hình bot Telegram hệ thống.", code=NotificationErrorCode.TELEGRAM_BOT_MISSING
            )
        username = bot["username"]
        if not username:
            me = self.client.get_me(self.telegram_bot_service.token())
            username = str(me.get("username") or "").lstrip("@").strip()
        if not username:
            raise BusinessRuleError(
                "Không xác định được username bot Telegram.", code=NotificationErrorCode.TELEGRAM_UNAVAILABLE
            )
        code = secrets.token_urlsafe(9).replace("-", "").replace("_", "")[:CODE_LENGTH]
        chat = self.repository.create(
            actor=actor,
            owner=actor,
            registration_code=code,
            registration_expires_at=timezone.now() + timedelta(minutes=TELEGRAM_REGISTRATION_MINUTES),
        )
        parameter = LINK_KINDS.get(kind, LINK_KINDS["group"])
        return {"chat": chat, "code": code, "link": f"https://t.me/{username}?{parameter}={code}"}

    @transaction.atomic
    def verify(self, actor: Any, pk: Any) -> TelegramChat:
        """Tìm `/start <mã>` qua `getUpdates` khi dùng nút Kiểm tra thủ công (dev local), gửi tin xác nhận."""
        chat = self.get_for_write(actor, pk)
        if chat.status != Status.PENDING or not chat.registration_code:
            return chat
        if chat.registration_expires_at and chat.registration_expires_at < timezone.now():
            raise BusinessRuleError(
                "Mã đăng ký đã hết hạn, hãy tạo mã mới.",
                code=NotificationErrorCode.TELEGRAM_REGISTRATION_EXPIRED,
            )
        token = self.telegram_bot_service.token()
        found = self._find_registration(token, chat.registration_code)
        if found is None:
            raise BusinessRuleError(
                "Chưa thấy bot nhận mã này.", code=NotificationErrorCode.TELEGRAM_REGISTRATION_NOT_FOUND
            )
        if found.get("type") != "private":
            bot_id = self._resolve_bot_id(token)
            member = self.client.get_chat_member(token, str(found["id"]), int(bot_id))
            if member.get("status") not in SENDER_ROLES:
                raise BusinessRuleError(
                    "Bot không có quyền gửi trong nhóm.", code=NotificationErrorCode.TELEGRAM_CHAT_INACTIVE
                )
        updated = self._activate_chat(chat, found, actor=actor)
        self.client.send_message(
            token, str(updated.chat_id), "✅ Đã kết nối với ToanNX. Thông báo sẽ gửi vào đây."
        )
        return updated

    @transaction.atomic
    def register_from_webhook_update(self, update: dict[str, Any]) -> TelegramChat | None:
        """Xử lý sự kiện `/start <code>` hoặc `my_chat_member` từ webhook Bot chung."""
        my_chat_member = update.get("my_chat_member")
        if isinstance(my_chat_member, dict):
            self._handle_membership_change(my_chat_member)

        message = update.get("message")
        if not isinstance(message, dict):
            return None
        code = self._extract_start_code(str(message.get("text") or ""))
        chat_obj = message.get("chat")
        if not code or not isinstance(chat_obj, dict) or chat_obj.get("id") is None:
            return None

        pending = self.repository.find_one(registration_code=code, status=Status.PENDING)
        if pending is None:
            return None
        if pending.registration_expires_at and pending.registration_expires_at < timezone.now():
            return None

        updated = self._activate_chat(pending, chat_obj, actor=pending.owner)
        if self.telegram_bot_service.is_configured():
            self.client.send_message(
                self.telegram_bot_service.token(),
                str(updated.chat_id),
                "✅ Đã kết nối với ToanNX. Thông báo sẽ gửi vào đây.",
            )
        return updated

    def send_test(self, actor: Any, pk: Any) -> TelegramChat:
        """Gửi tin thử và cập nhật trạng thái theo kết quả."""
        chat = self.get_by_id_for(actor, pk)
        if not chat.chat_id:
            raise BusinessRuleError("Chat chưa xác minh.", code=NotificationErrorCode.TELEGRAM_CHAT_INACTIVE)
        token = self.telegram_bot_service.token()
        return self.apply_send_result(
            chat, self.client.send_message(token, chat.chat_id, "🔔 Tin thử từ ToanNX.")
        )

    def verified_for(self, actor: Any) -> list[TelegramChat]:
        """Chat đã xác minh, đang bật của actor (dùng cho tùy chọn thông báo)."""
        return list(self.repository.filter(owner_id=actor.pk, status=Status.ACTIVE, is_active=True))

    def active_by_chat_id(self, chat_id: str) -> list[TelegramChat]:
        """Danh sách bản ghi TelegramChat đang hoạt động ứng với một `chat_id` Telegram."""
        return list(self.repository.filter(chat_id=chat_id, status=Status.ACTIVE, is_active=True))

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

    def _activate_chat(self, pending: TelegramChat, chat_obj: dict[str, Any], *, actor: Any) -> TelegramChat:
        external_chat_id = str(chat_obj["id"])
        existing = self.repository.find_one(owner_id=pending.owner_id, chat_id=external_chat_id)
        target = existing or pending
        updated = self.repository.update(
            target,
            actor=actor,
            chat_id=external_chat_id,
            title=chat_obj.get("title") or chat_obj.get("username") or chat_obj.get("first_name") or "",
            chat_type=chat_obj.get("type", ""),
            status=Status.ACTIVE,
            is_active=True,
            registration_code=None,
            registration_expires_at=None,
            last_verified_at=timezone.now(),
            last_error_code="",
        )
        if existing is not None and existing.pk != pending.pk:
            self.repository.hard_delete(pending)
        return updated

    def _handle_membership_change(self, event: dict[str, Any]) -> None:
        chat_obj = event.get("chat") or {}
        if chat_obj.get("id") is None:
            return
        external_chat_id = str(chat_obj["id"])
        new_status = str((event.get("new_chat_member") or {}).get("status") or "")
        if new_status in LEFT_STATUSES:
            self.repository.update_where(
                {"status": Status.REMOVED, "last_error_code": "TELEGRAM_403"}, chat_id=external_chat_id
            )
        elif new_status in SENDER_ROLES:
            self.repository.update_where(
                {"status": Status.ACTIVE, "last_error_code": ""}, chat_id=external_chat_id
            )

    def _resolve_bot_id(self, token: str) -> str:
        info = self.telegram_bot_service.bot_info()
        bot_id = str(info.get("bot_id") or "").strip()
        if bot_id:
            return bot_id
        me = self.client.get_me(token)
        return str(me.get("id") or "")

    def _find_registration(self, token: str, code: str) -> dict[str, Any] | None:
        for update in reversed(self.client.get_updates(token)):
            message = update.get("message") or {}
            extracted = self._extract_start_code(str(message.get("text") or ""))
            if extracted and extracted == code:
                return message.get("chat") or None
        return None

    @staticmethod
    def _extract_start_code(text: str) -> str:
        parts = text.strip().split()
        if len(parts) < 2:
            return ""
        cmd = parts[0]
        if cmd == "/start" or cmd.startswith("/start@"):
            return parts[1].strip()
        return ""
