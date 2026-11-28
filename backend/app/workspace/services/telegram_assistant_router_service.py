"""Bộ định tuyến Webhook Telegram hai chiều cho Trợ lý AI (DM, Group đa chủ sở hữu & QStash 1-hop)."""

import json
import logging
import re
from typing import Any

from app.core.utils.url import build_backend_url
from app.system.models.telegram_chat import TelegramChat
from app.system.services.qstash_client import QstashClient
from app.system.services.telegram_bot_service import TelegramBotService
from app.system.services.telegram_chat_service import TelegramChatService
from app.workspace.constants.group_tool_policy import GroupToolPolicy
from app.workspace.constants.workspace_defaults import QUICK_REPLY_CALLBACK_PREFIX, SLASH_COMMAND_ALIASES
from app.workspace.models.assistant_conversation import AssistantConversation
from app.workspace.services.assistant_config_service import AssistantConfigService
from app.workspace.services.assistant_result_card_builder import AssistantResultCardBuilder
from app.workspace.services.assistant_service import AssistantService
from app.workspace.services.assistant_slash_service import AssistantSlashService
from app.workspace.services.telegram_assistant_reply_service import TelegramAssistantReplyService

logger = logging.getLogger(__name__)
GROUP_CHAT_TYPES = frozenset({"group", "supergroup"})


class TelegramAssistantRouterService:
    """Nhận update từ `system.TelegramWebhookService`, định tuyến đa chủ sở hữu và đẩy QStash."""

    def __init__(
        self,
        telegram_chat_service: TelegramChatService | None = None,
        telegram_bot_service: TelegramBotService | None = None,
        qstash_client: QstashClient | None = None,
        assistant_service: AssistantService | None = None,
        config_service: AssistantConfigService | None = None,
        slash_service: AssistantSlashService | None = None,
        reply_service: TelegramAssistantReplyService | None = None,
        result_card_builder: AssistantResultCardBuilder | None = None,
    ) -> None:
        """Khởi tạo toàn bộ phụ thuộc định tuyến Telegram & xử lý AI."""
        self.config_service = config_service or AssistantConfigService()
        self.telegram_bot_service = telegram_bot_service or TelegramBotService()
        self.telegram_chat_service = telegram_chat_service or TelegramChatService(
            telegram_bot_service=self.telegram_bot_service
        )
        self.qstash_client = qstash_client or QstashClient()
        self.assistant_service = assistant_service or AssistantService(config_service=self.config_service)
        self.slash_service = slash_service or AssistantSlashService()
        self.reply_service = reply_service or TelegramAssistantReplyService(
            bot_service=self.telegram_bot_service
        )
        self.result_card_builder = result_card_builder or AssistantResultCardBuilder()

    def handle_webhook_update(self, update: dict[str, Any]) -> dict[str, Any]:
        """Điểm vào đăng ký trên `module_registry`: xử lý sync Slash/DM hoặc đẩy 1-hop QStash."""
        return self._route_update(update, allow_qstash_offload=True)

    def process_async_update(self, update: dict[str, Any]) -> dict[str, Any]:
        """Điểm vào từ endpoint QStash `/workspace/assistant/telegram-process`: chạy thẳng LLM."""
        return self._route_update(update, allow_qstash_offload=False)

    def _route_update(self, update: dict[str, Any], *, allow_qstash_offload: bool) -> dict[str, Any]:
        callback = update.get("callback_query")
        choice: dict[str, Any] | None = None
        if isinstance(callback, dict):
            message, choice = self._message_from_callback(callback)
            if message is None:
                return {"handled": False, "reason": "invalid_callback"}
        else:
            message = update.get("message")
        if not isinstance(message, dict):
            return {"handled": False, "reason": "no_message"}

        text = str(message.get("text") or "").strip()
        chat_obj = message.get("chat") or {}
        from_obj = message.get("from") or {}
        if bool(from_obj.get("is_bot")):
            return {"handled": False, "reason": "ignore_bot_sender"}
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
        if chat_type == "private" and (cmd == "/start" or canonical_cmd == "verify_owner"):
            if canonical_cmd == "verify_owner":
                self.reply_service.send_reply(
                    chat_id,
                    "✅ Tài khoản Telegram DM này đã được liên kết sẵn trong Hồ sơ cá nhân.",
                    reply_to_message_id=reply_to_id,
                )
            return {"handled": True, "reason": "owner_verified"}

        is_group = chat_type in GROUP_CHAT_TYPES
        telegram_chat, is_owner, owner_dm_chat_id = self._resolve_chat_owner(
            active_chats, is_group=is_group, sender_tg_id=sender_tg_id
        )
        if telegram_chat is None:
            return {"handled": False, "reason": "assistant_disabled_or_chat_not_allowed"}

        if choice is not None:
            if not is_owner:
                # Chỉ chủ sở hữu mới trả lời được câu hỏi lựa chọn trên dữ liệu của mình.
                self.reply_service.reject_choice(choice["id"], "Chỉ chủ sở hữu mới chọn được mục này.")
                return {"handled": True, "reason": "choice_not_owner"}
            self.reply_service.acknowledge_choice(choice["id"], chat_id, choice["message_id"], text)

        require_mention = (
            bool(admin_cfg.get("telegram_group_require_mention", True))
            and telegram_chat.group_reply_mode != TelegramChat.GroupReplyMode.ALL_MESSAGES
        )
        if is_group and require_mention and choice is None and not self._is_bot_mentioned(message, text):
            return {"handled": False, "reason": "mention_required"}

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
        cleaned_text = self._strip_bot_mention(text)
        cmd, _ = self.slash_service.parse_command(cleaned_text)
        is_slash = bool(cmd)
        # Bấm nút lựa chọn: xử lý ngay (0 token, không cần đẩy QStash).
        if not is_slash and choice is None and allow_qstash_offload and self.qstash_client.is_configured():
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
            telegram_chat.owner,
            cleaned_text,
            channel=channel,
            external_chat_id=chat_id,
            sender_telegram_id=sender_tg_id,
            sender_name=sender_name,
            is_owner=is_owner,
            allow_personal_tools=allow_personal_tools,
            exclude_private_history=exclude_private_history,
            hide_amounts=hide_amounts,
        )

        saved_message = res.get("message")
        raw_metadata = getattr(saved_message, "metadata", None)
        metadata: dict[str, Any] = raw_metadata if isinstance(raw_metadata, dict) else {}
        quick_replies = metadata.get("quick_replies") or None
        quick_input = metadata.get("quick_input") if isinstance(metadata.get("quick_input"), dict) else None
        is_question = bool(quick_replies or quick_input)
        # Telegram không vẽ thẻ: gắn đúng một dòng link xem lại mỗi bản ghi (nội dung lưu không chứa link).
        reply_text = str(res["reply"])
        raw_cards = metadata.get("cards")
        cards: list[dict[str, Any]] = raw_cards if isinstance(raw_cards, list) else []
        links = self.result_card_builder.link_lines(cards)
        if links:
            reply_text = f"{reply_text.rstrip()}\n\n{links}"

        if res.get("user_input_masked") and reply_to_id is not None:
            # Tin người dùng vừa gõ mật khẩu: xóa khỏi khung chat (bot có quyền thì xóa được).
            self.reply_service.delete_user_message(chat_id, reply_to_id)

        if is_group and quick_input and quick_input.get("kind") == "secret":
            # Không thu mật khẩu trong nhóm: người khác cùng đọc được.
            self.assistant_service.cancel_pending(str(res.get("conversation_id") or ""))
            self.reply_service.send_reply(
                chat_id,
                "🔒 Vì an toàn, mục có mật khẩu hãy tạo trong tin nhắn riêng với Bot hoặc trên Web. "
                "Mình đã hủy thao tác đang làm dở.",
                reply_to_message_id=reply_to_id,
            )
            return {"handled": True, "queued": False, "replied_in_dm": False}

        # Nếu Admin cấu hình reply_in_dm=True và turn có dữ liệu riêng tư → gửi DM cho chính chủ.
        # Câu hỏi lựa chọn giữ trong chat hiện tại (nháp gắn với hội thoại này).
        if (
            not is_question
            and is_group
            and bool(admin_cfg.get("telegram_group_reply_in_dm", False))
            and is_owner
            and res.get("contains_private_data")
            and owner_dm_chat_id is not None
        ):
            self.reply_service.send_private_dm_with_fallback(
                dm_chat_id=owner_dm_chat_id,
                group_chat_id=chat_id,
                group_reply_to_message_id=reply_to_id,
                private_text=reply_text,
                model_used=str(res.get("model_used") or ""),
            )
            return {"handled": True, "queued": False, "replied_in_dm": True}

        self.reply_service.send_reply(
            chat_id,
            reply_text,
            reply_to_message_id=reply_to_id,
            model_used=str(res.get("model_used") or ""),
            quick_replies=quick_replies,
            quick_input=quick_input,
        )
        return {"handled": True, "queued": False, "replied_in_dm": False}

    def _message_from_callback(
        self, callback: dict[str, Any]
    ) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
        """Đổi lần bấm nút inline (`aqr:<n>`) thành tin nhắn văn bản bằng nhãn nút, chạy luồng chat chung."""
        data = str(callback.get("data") or "")
        origin = callback.get("message") or {}
        if not data.startswith(QUICK_REPLY_CALLBACK_PREFIX) or not isinstance(origin, dict):
            return None, None
        keyboard = ((origin.get("reply_markup") or {}).get("inline_keyboard")) or []
        label = next(
            (
                str(button.get("text") or "")
                for row in keyboard
                if isinstance(row, list)
                for button in row
                if isinstance(button, dict) and button.get("callback_data") == data
            ),
            "",
        )
        if not label:
            return None, None
        message_id = origin.get("message_id")
        synthetic = {
            "message_id": message_id,
            "text": label,
            "chat": origin.get("chat") or {},
            "from": callback.get("from") or {},
        }
        choice = {"id": str(callback.get("id") or ""), "message_id": int(message_id) if message_id else None}
        return synthetic, choice

    def _resolve_chat_owner(
        self,
        active_chats: list[Any],
        *,
        is_group: bool,
        sender_tg_id: int | None,
    ) -> tuple[Any | None, bool, int | None]:
        """Định tuyến chủ sở hữu theo `system.TelegramChat` đang bật ở Hồ sơ → Thông báo."""
        if not active_chats:
            return None, False, None
        if not is_group:
            return active_chats[0], True, sender_tg_id

        if sender_tg_id is not None:
            sender_dms = self.telegram_chat_service.active_by_chat_id(str(sender_tg_id))
            sender_owner_ids = {chat.owner_id for chat in sender_dms}
            for group_chat in active_chats:
                if group_chat.owner_id in sender_owner_ids:
                    return group_chat, True, sender_tg_id

        return active_chats[0], False, None

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

    def _strip_bot_mention(self, text: str) -> str:
        """Gỡ `@bot_username` ở đầu câu để nhận diện chính xác cả `@bot /hom_nay` lẫn `@bot hôm nay có gì`."""
        info = self.telegram_bot_service.bot_info()
        username = str(info.get("username") or "").lstrip("@").strip()
        if not username:
            return text
        cleaned = re.sub(
            rf"^(?:@{re.escape(username)}[\s,:;-]*)+",
            "",
            text.strip(),
            flags=re.IGNORECASE,
        ).strip()
        return cleaned or text
