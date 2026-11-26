"""Bộ định tuyến Webhook Telegram hai chiều cho Trợ lý AI (DM, Group đa chủ sở hữu & QStash 1-hop)."""

import json
import logging
from typing import Any

from app.core.utils.url import build_backend_url
from app.system.services.qstash_client import QstashClient
from app.system.services.telegram_bot_service import TelegramBotService
from app.system.services.telegram_chat_service import TelegramChatService
from app.workspace.constants.group_tool_policy import GroupToolPolicy
from app.workspace.constants.workspace_defaults import SLASH_COMMAND_ALIASES
from app.workspace.models.assistant_conversation import AssistantConversation
from app.workspace.models.workspace_setting import WorkspaceSetting
from app.workspace.repositories.workspace_setting_repository import WorkspaceSettingRepository
from app.workspace.services.assistant_config_service import AssistantConfigService
from app.workspace.services.assistant_service import AssistantService
from app.workspace.services.assistant_slash_service import AssistantSlashService
from app.workspace.services.telegram_assistant_reply_service import TelegramAssistantReplyService
from app.workspace.services.workspace_setting_service import WorkspaceSettingService

logger = logging.getLogger(__name__)
GROUP_CHAT_TYPES = frozenset({"group", "supergroup"})


class TelegramAssistantRouterService:
    """Nhận update từ `system.TelegramWebhookService`, định tuyến đa chủ sở hữu và đẩy QStash."""

    def __init__(
        self,
        setting_repository: WorkspaceSettingRepository | None = None,
        setting_service: WorkspaceSettingService | None = None,
        telegram_chat_service: TelegramChatService | None = None,
        telegram_bot_service: TelegramBotService | None = None,
        qstash_client: QstashClient | None = None,
        assistant_service: AssistantService | None = None,
        config_service: AssistantConfigService | None = None,
        slash_service: AssistantSlashService | None = None,
        reply_service: TelegramAssistantReplyService | None = None,
    ) -> None:
        """Khởi tạo toàn bộ phụ thuộc định tuyến Telegram & xử lý AI."""
        self.setting_repository = setting_repository or WorkspaceSettingRepository()
        self.setting_service = setting_service or WorkspaceSettingService(repository=self.setting_repository)
        self.config_service = config_service or AssistantConfigService()
        self.telegram_bot_service = telegram_bot_service or TelegramBotService()
        self.telegram_chat_service = telegram_chat_service or TelegramChatService(
            telegram_bot_service=self.telegram_bot_service
        )
        self.qstash_client = qstash_client or QstashClient()
        self.assistant_service = assistant_service or AssistantService(
            setting_service=self.setting_service, config_service=self.config_service
        )
        self.slash_service = slash_service or AssistantSlashService(setting_service=self.setting_service)
        self.reply_service = reply_service or TelegramAssistantReplyService(
            bot_service=self.telegram_bot_service
        )

    def handle_webhook_update(self, update: dict[str, Any]) -> dict[str, Any]:
        """Điểm vào đăng ký trên `module_registry`: xử lý sync Slash/DM hoặc đẩy 1-hop QStash."""
        return self._route_update(update, allow_qstash_offload=True)

    def process_async_update(self, update: dict[str, Any]) -> dict[str, Any]:
        """Điểm vào từ endpoint QStash `/workspace/assistant/telegram-process`: chạy thẳng LLM."""
        return self._route_update(update, allow_qstash_offload=False)

    def _route_update(self, update: dict[str, Any], *, allow_qstash_offload: bool) -> dict[str, Any]:
        message = update.get("message")
        if not isinstance(message, dict):
            return {"handled": False, "reason": "no_message"}

        text = str(message.get("text") or "").strip()
        chat_obj = message.get("chat") or {}
        from_obj = message.get("from") or {}
        chat_id_raw = chat_obj.get("id")
        if chat_id_raw is None or not text:
            return {"handled": False, "reason": "empty_text_or_chat"}

        chat_id = str(chat_id_raw)
        chat_type = str(chat_obj.get("type") or "")
        sender_id_raw = from_obj.get("id")
        sender_tg_id = int(sender_id_raw) if sender_id_raw is not None else None
        sender_name = str(
            from_obj.get("username") or from_obj.get("first_name") or from_obj.get("last_name") or ""
        ).strip()
        msg_id = message.get("message_id")
        reply_to_id = int(msg_id) if msg_id is not None else None

        active_chats = self.telegram_chat_service.active_by_chat_id(chat_id)
        if not active_chats:
            return {"handled": False, "reason": "unregistered_chat"}

        admin_cfg = self.config_service.get_config()
        if not admin_cfg.get("telegram_ai_enabled", True):
            return {"handled": False, "reason": "telegram_ai_globally_disabled"}

        # Khi nhắn /start <code>, /xac_minh hoặc /verify_owner từ Private DM: tự gắn telegram_owner_user_id.
        cmd, _ = self.slash_service.parse_command(text)
        canonical_cmd = SLASH_COMMAND_ALIASES.get(cmd)
        if (
            chat_type == "private"
            and sender_tg_id is not None
            and (cmd == "/start" or canonical_cmd == "verify_owner")
        ):
            owner_chat = active_chats[0]
            self.setting_service.attach_telegram_owner_from_dm(owner_chat.owner, sender_tg_id)
            if canonical_cmd == "verify_owner":
                self.reply_service.send_reply(
                    chat_id,
                    "✅ Đã xác minh Telegram User ID chính chủ cho Trợ lý cá nhân.",
                    reply_to_message_id=reply_to_id,
                )
            return {"handled": True, "reason": "owner_verified"}

        target_setting, telegram_chat = self._resolve_setting(
            active_chats, chat_type=chat_type, sender_tg_id=sender_tg_id
        )
        if target_setting is None or telegram_chat is None:
            return {"handled": False, "reason": "assistant_disabled_or_chat_not_allowed"}

        is_group = chat_type in GROUP_CHAT_TYPES
        if (
            is_group
            and bool(admin_cfg.get("telegram_group_require_mention", True))
            and not self._is_bot_mentioned(message, text)
        ):
            return {"handled": False, "reason": "mention_required"}

        # Xác định ngữ cảnh chính chủ, quyền dùng tool & ẩn số tiền trong Group theo cấu hình Admin.
        is_owner = (
            sender_tg_id is not None
            and target_setting.telegram_owner_user_id is not None
            and int(sender_tg_id) == int(target_setting.telegram_owner_user_id)
        )
        if not is_group and sender_tg_id is not None and target_setting.telegram_owner_user_id is None:
            # Lần đầu chat trực tiếp trong DM đã liên kết thì xem như chính chủ.
            self.setting_service.attach_telegram_owner_from_dm(target_setting.owner, sender_tg_id)
            is_owner = True

        allow_personal_tools = True
        exclude_private_history = False
        hide_amounts = False
        if is_group:
            hide_amounts = bool(admin_cfg.get("telegram_group_hide_amounts", False))
            policy = str(admin_cfg.get("telegram_group_tool_policy") or GroupToolPolicy.OWNER_ONLY)
            if policy == GroupToolPolicy.DISABLED or (policy == GroupToolPolicy.OWNER_ONLY and not is_owner):
                allow_personal_tools = False
                exclude_private_history = True

        # Nếu là câu hỏi tự nhiên + có QStash ở pha webhook -> đẩy 1-hop để trả 200 OK < 200ms.
        is_slash = bool(cmd)
        if not is_slash and allow_qstash_offload and self.qstash_client.is_configured():
            update_id = update.get("update_id") or f"{chat_id}-{reply_to_id}"
            dest = build_backend_url("/api/v1/workspace/assistant/telegram-process")
            if self.qstash_client.publish(
                dest,
                deduplication_id=f"ws-tg-{update_id}",
                body=json.dumps({"update": update}, ensure_ascii=False).encode("utf-8"),
            ):
                return {"handled": True, "queued": True}

        channel = (
            AssistantConversation.Channel.TELEGRAM_GROUP
            if is_group
            else AssistantConversation.Channel.TELEGRAM_DM
        )
        res = self.assistant_service.chat(
            target_setting.owner,
            text,
            channel=channel,
            external_chat_id=chat_id,
            sender_telegram_id=sender_tg_id,
            sender_name=sender_name,
            is_owner=is_owner,
            allow_personal_tools=allow_personal_tools,
            exclude_private_history=exclude_private_history,
            hide_amounts=hide_amounts,
        )

        # Nếu Admin cấu hình reply_in_dm=True và turn có dữ liệu riêng tư → gửi DM cho chính chủ.
        if (
            is_group
            and bool(admin_cfg.get("telegram_group_reply_in_dm", False))
            and is_owner
            and res.get("contains_private_data")
            and target_setting.telegram_owner_user_id
        ):
            self.reply_service.send_private_dm_with_fallback(
                dm_chat_id=int(target_setting.telegram_owner_user_id),
                group_chat_id=chat_id,
                group_reply_to_message_id=reply_to_id,
                private_text=str(res["reply"]),
                model_used=str(res.get("model_used") or ""),
            )
            return {"handled": True, "queued": False, "replied_in_dm": True}

        self.reply_service.send_reply(
            chat_id,
            str(res["reply"]),
            reply_to_message_id=reply_to_id,
            model_used=str(res.get("model_used") or ""),
        )
        return {"handled": True, "queued": False, "replied_in_dm": False}

    def _resolve_setting(
        self, active_chats: list[Any], *, chat_type: str, sender_tg_id: int | None
    ) -> tuple[WorkspaceSetting | None, Any | None]:
        """Định tuyến đa chủ sở hữu: lọc chat nằm trong `telegram_allowed_chat_ids` của Setting."""
        chat_by_owner = {chat.owner_id: chat for chat in active_chats}
        settings_list = self.setting_repository.find_by_owners(list(chat_by_owner.keys()))

        candidates: list[tuple[WorkspaceSetting, Any]] = []
        for setting in settings_list:
            owner_chat = chat_by_owner.get(setting.owner_id)
            if owner_chat is None:
                continue
            allowed_ids = {str(cid) for cid in (setting.telegram_allowed_chat_ids or [])}
            if str(owner_chat.pk) in allowed_ids:
                candidates.append((setting, owner_chat))

        if not candidates:
            return None, None
        if len(candidates) == 1:
            return candidates[0]

        # Nhiều user chung 1 nhóm cùng bật AI: ưu tiên đúng người có telegram_owner_user_id == sender.
        if sender_tg_id is not None:
            for setting, owner_chat in candidates:
                if setting.telegram_owner_user_id is not None and int(setting.telegram_owner_user_id) == int(
                    sender_tg_id
                ):
                    return setting, owner_chat

        if chat_type == "private":
            return candidates[0]
        return None, None

    def _is_bot_mentioned(self, message: dict[str, Any], text: str) -> bool:
        info = self.telegram_bot_service.bot_info()
        username = str(info.get("username") or "").lstrip("@").lower()
        lowered = text.lower()
        if username and f"@{username}" in lowered:
            return True
        cmd, _ = self.slash_service.parse_command(text)
        if cmd and ("@" not in text.split()[0] or (username and f"@{username}" in text.split()[0].lower())):
            return True
        reply_to = message.get("reply_to_message")
        if isinstance(reply_to, dict):
            reply_from = reply_to.get("from") or {}
            if reply_from.get("is_bot") and (
                not username or str(reply_from.get("username") or "").lower() == username
            ):
                return True
        return False
