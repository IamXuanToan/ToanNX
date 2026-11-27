"""Nghiệp vụ điều phối Trợ lý AI: 1 luồng Web duy nhất, config Bot từ Admin & xKiro Fallback."""

import json
import time
from datetime import time as dt_time
from typing import Any

from app.workspace.constants.workspace_defaults import (
    AI_HISTORY_CONTEXT_LIMIT,
    AI_MAX_TOOL_ROUNDS,
    AI_REQUEST_DEADLINE_SECONDS,
    SLASH_COMMAND_ALIASES,
    SLASH_COMMAND_NAMES,
)
from app.workspace.models.assistant_conversation import AssistantConversation
from app.workspace.models.assistant_message import AssistantMessage
from app.workspace.services.assistant_config_service import AssistantConfigService
from app.workspace.services.assistant_conversation_service import AssistantConversationService
from app.workspace.services.assistant_slash_service import AssistantSlashService
from app.workspace.services.assistant_tools_service import AssistantToolsService
from app.workspace.services.workspace_setting_service import WorkspaceSettingService
from app.workspace.services.workspace_timezone_service import WorkspaceTimezoneService
from app.workspace.services.xkiro_client import XkiroClient

WEEKDAY_NAMES_VI = (
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
    "Chủ Nhật",
)

SYSTEM_PROMPT = (
    "Bạn là Trợ lý AI cá nhân thông minh trong hệ thống ToanNX. "
    "Chốt an toàn bắt buộc: tuyệt đối KHÔNG nói về khủng bố, bạo lực cực đoan, vũ khí, quân sự, "
    "chiến tranh hay phân biệt vùng miền, sắc tộc, tôn giáo, giới tính; nếu bị hỏi hãy từ chối ngắn gọn. "
    "Trả lời súc tích, lịch sự bằng tiếng Việt có dấu (trừ khi người dùng dùng tiếng Anh), trình bày "
    "Markdown rõ ràng (**in đậm**, danh sách gạch đầu dòng `- `, bảng khi có nhiều mục). "
    "Chỉ dùng dữ liệu thật từ các tool đã cung cấp, tuyệt đối không bịa đặt số liệu "
    "và không bao giờ truy cập hay suy đoán mật khẩu/API key trong Két sắt. "
    "Khi người dùng hỏi về lịch/sự kiện sắp tới, tuần tới hoặc các hạn sắp đến, hãy ưu tiên gọi "
    "`get_upcoming_events` (hoặc kết hợp nhắc việc + dịch vụ sắp gia hạn). "
    "Khi tạo nhắc việc xong (`create_quick_reminder`), xác nhận rõ tiêu đề, ngày, giờ và mức ưu tiên. "
    "Tuyệt đối KHÔNG bao giờ in JSON thô hay UUID nội bộ ra câu trả lời cho người dùng."
)


class AssistantService:
    """Điều phối 1 luồng chat Web & kênh Telegram qua `xKiro`, 8 tool cá nhân & 7 lệnh Slash 0-token."""

    def __init__(
        self,
        conversation_service: AssistantConversationService | None = None,
        setting_service: WorkspaceSettingService | None = None,
        config_service: AssistantConfigService | None = None,
        tz_service: WorkspaceTimezoneService | None = None,
        xkiro_client: XkiroClient | None = None,
        tools_service: AssistantToolsService | None = None,
        slash_service: AssistantSlashService | None = None,
    ) -> None:
        """Khởi tạo service hội thoại, cài đặt, cấu hình Bot Admin, client AI và bộ tool."""
        self.conversation_service = conversation_service or AssistantConversationService()
        self.setting_service = setting_service or WorkspaceSettingService()
        self.config_service = config_service or AssistantConfigService()
        self.tz_service = tz_service or WorkspaceTimezoneService()
        self.xkiro_client = xkiro_client or XkiroClient()
        self.tools_service = tools_service or AssistantToolsService()
        self.slash_service = slash_service or AssistantSlashService(
            tools_service=self.tools_service,
            setting_service=self.setting_service,
            tz_service=self.tz_service,
        )

    def chat(
        self,
        owner: Any,
        message_text: str,
        *,
        channel: str = AssistantConversation.Channel.WEB,
        external_chat_id: str = "",
        sender_telegram_id: int | None = None,
        sender_name: str = "",
        is_owner: bool = True,
        allow_personal_tools: bool = True,
        exclude_private_history: bool = False,
        hide_amounts: bool = False,
    ) -> dict[str, Any]:
        """Xử lý 1 lượt trò chuyện vào luồng chat duy nhất của Web hoặc kênh Telegram."""
        cleaned = (message_text or "").strip()
        cmd, _ = self.slash_service.parse_command(cleaned)
        canonical = SLASH_COMMAND_ALIASES.get(cmd, "")

        conversation = self.conversation_service.get_or_create_active(
            owner,
            channel=channel,
            external_chat_id=external_chat_id,
            title=cleaned[:120],
        )

        if canonical == "clear":
            deleted_count = self.conversation_service.clear_conversation(conversation, actor=owner)
            reply = f"🧹 Đã xóa lịch sử trò chuyện ({deleted_count} tin nhắn)."
            saved = self.conversation_service.append_message(
                conversation,
                role=AssistantMessage.Role.ASSISTANT,
                content=reply,
                model_used="slash",
                tokens_used=0,
                contains_private_data=False,
                is_error=False,
            )
            return self._build_response(conversation, saved, is_fallback=False, fallback_attempts=0)

        self.conversation_service.append_message(
            conversation,
            role=AssistantMessage.Role.USER,
            content=cleaned,
            sender_telegram_id=sender_telegram_id,
            sender_name=sender_name,
        )

        if cmd:
            slash_res = self.slash_service.execute(
                owner,
                cleaned,
                is_owner=is_owner,
                allow_personal_tools=allow_personal_tools,
                hide_amounts=hide_amounts,
            )
            assistant_msg = self.conversation_service.append_message(
                conversation,
                role=AssistantMessage.Role.ASSISTANT,
                content=slash_res["reply"],
                model_used="slash",
                tokens_used=0,
                contains_private_data=bool(slash_res["contains_private_data"]),
                is_error=False,
            )
            return self._build_response(conversation, assistant_msg, is_fallback=False, fallback_attempts=0)

        setting = self.setting_service.get_or_create_for_owner(owner)
        bot_cfg = self.config_service.get_config()
        daily_limit = bot_cfg.get("ai_daily_token_limit")
        preferred_model = str(bot_cfg.get("preferred_ai_model") or "")
        custom_policy = str(bot_cfg.get("assistant_system_prompt") or "")

        if daily_limit is not None:
            used_today = self._tokens_used_today(owner.pk, setting.timezone)
            if used_today >= int(daily_limit):
                return self._save_fallback(
                    conversation,
                    "Bạn đã dùng hết hạn mức token AI trong ngày hôm nay.",
                    code="WORKSPACE_AI_DAILY_LIMIT_EXCEEDED",
                    attempts=0,
                )

        if not self.xkiro_client.is_configured():
            return self._save_fallback(
                conversation,
                "Trợ lý AI xKiro chưa được cấu hình trên hệ thống.",
                code="WORKSPACE_AI_NOT_CONFIGURED",
                attempts=0,
            )

        llm_messages = self._assemble_llm_context(
            conversation.pk,
            tz_name=setting.timezone,
            exclude_private=exclude_private_history,
            hide_amounts=hide_amounts,
            allow_tools=allow_personal_tools,
            custom_policy=custom_policy,
        )
        tools = self.tools_service.tool_schemas(is_owner=is_owner) if allow_personal_tools else None

        deadline = time.monotonic() + AI_REQUEST_DEADLINE_SECONDS
        total_tokens = 0
        fallback_attempts = 0
        last_model = ""
        used_private_tool = False
        executed_tools: list[tuple[str, dict[str, Any]]] = []
        seen_signatures: set[str] = set()

        for round_idx in range(AI_MAX_TOOL_ROUNDS):
            result = self.xkiro_client.chat_completion(
                llm_messages,
                tools=tools,
                preferred_model=preferred_model,
                deadline_monotonic=deadline,
            )
            fallback_attempts += int(result.get("fallback_attempts") or 0)
            if not result.get("ok"):
                if executed_tools:
                    break
                return self._save_fallback(
                    conversation,
                    "Hệ thống AI tạm thời quá tải hoặc đang giới hạn tốc độ.",
                    code="WORKSPACE_AI_UNAVAILABLE",
                    attempts=fallback_attempts,
                )

            last_model = str(result.get("model") or last_model)
            total_tokens += int(result.get("tokens") or 0)
            ai_msg = result.get("message") or {}
            normalized_calls = self._normalize_tool_calls(ai_msg.get("tool_calls") or [], round_idx)

            if not normalized_calls or not allow_personal_tools:
                reply_text = self._finalize_reply_text(
                    str(ai_msg.get("content") or ""), executed_tools, default_text="Mình đã ghi nhận yêu cầu."
                )
                saved = self.conversation_service.append_message(
                    conversation,
                    role=AssistantMessage.Role.ASSISTANT,
                    content=reply_text,
                    model_used=last_model,
                    tokens_used=total_tokens,
                    contains_private_data=used_private_tool,
                    is_error=False,
                )
                return self._build_response(
                    conversation,
                    saved,
                    is_fallback=False,
                    fallback_attempts=fallback_attempts,
                )

            batch_signature = json.dumps(
                [(c["function"]["name"], c["function"]["arguments"]) for c in normalized_calls],
                sort_keys=True,
            )
            if batch_signature in seen_signatures:
                break
            seen_signatures.add(batch_signature)

            used_private_tool = True
            self.conversation_service.append_message(
                conversation,
                role=AssistantMessage.Role.ASSISTANT,
                content="",
                tool_calls=normalized_calls,
                model_used=last_model,
                contains_private_data=True,
            )
            llm_messages.append(
                {
                    "role": "assistant",
                    "content": None,
                    "tool_calls": normalized_calls,
                }
            )

            for call in normalized_calls:
                fn = call["function"]
                fn_name = fn["name"]
                call_id = call["id"]
                tool_out = self.tools_service.execute_tool(
                    owner,
                    fn_name,
                    fn["arguments"],
                    is_owner=is_owner,
                    hide_amounts=hide_amounts,
                )
                executed_tools.append((fn_name, tool_out))
                serialized_out = json.dumps(tool_out, ensure_ascii=False)
                self.conversation_service.append_message(
                    conversation,
                    role=AssistantMessage.Role.TOOL,
                    content=serialized_out,
                    tool_call_id=call_id,
                    model_used=last_model,
                    contains_private_data=True,
                )
                llm_messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": call_id,
                        "content": serialized_out,
                    }
                )

        final_res = self.xkiro_client.chat_completion(
            llm_messages,
            tools=None,
            preferred_model=last_model or preferred_model,
            deadline_monotonic=deadline,
        )
        fallback_attempts += int(final_res.get("fallback_attempts") or 0)
        if final_res.get("ok"):
            final_msg = final_res.get("message") or {}
            last_model = str(final_res.get("model") or last_model)
            total_tokens += int(final_res.get("tokens") or 0)
            reply_text = self._finalize_reply_text(
                str(final_msg.get("content") or ""),
                executed_tools,
                default_text="Đã hoàn tất kiểm tra.",
            )
        elif executed_tools:
            reply_text = self._synthesize_reply_from_tools(executed_tools)
        else:
            return self._save_fallback(
                conversation,
                "Đã tra cứu dữ liệu nhưng không thể tổng hợp phản hồi lúc này.",
                code="WORKSPACE_AI_UNAVAILABLE",
                attempts=fallback_attempts,
            )

        saved = self.conversation_service.append_message(
            conversation,
            role=AssistantMessage.Role.ASSISTANT,
            content=reply_text,
            model_used=last_model,
            tokens_used=total_tokens,
            contains_private_data=used_private_tool,
            is_error=False,
        )
        return self._build_response(
            conversation, saved, is_fallback=False, fallback_attempts=fallback_attempts
        )

    def _normalize_tool_calls(self, raw_calls: list[Any], round_idx: int) -> list[dict[str, Any]]:
        normalized: list[dict[str, Any]] = []
        for idx, call in enumerate(raw_calls):
            if not isinstance(call, dict):
                continue
            fn = call.get("function")
            if not isinstance(fn, dict):
                continue
            fn_name = str(fn.get("name") or "").strip()
            if not fn_name:
                continue
            raw_args = fn.get("arguments")
            if isinstance(raw_args, dict):
                args_str = json.dumps(raw_args, ensure_ascii=False)
            elif raw_args is None:
                args_str = "{}"
            else:
                args_str = str(raw_args)
            call_id = str(call.get("id") or "").strip() or f"call_{round_idx}_{idx}"
            normalized.append(
                {
                    "id": call_id,
                    "type": "function",
                    "function": {"name": fn_name, "arguments": args_str},
                }
            )
        return normalized

    def _finalize_reply_text(
        self,
        raw_text: str,
        executed_tools: list[tuple[str, dict[str, Any]]],
        *,
        default_text: str,
    ) -> str:
        cleaned = (raw_text or "").strip()
        if cleaned and not self._looks_like_leaked_tool_json(cleaned):
            return cleaned
        if executed_tools:
            return self._synthesize_reply_from_tools(executed_tools)
        return default_text

    def _looks_like_leaked_tool_json(self, text: str) -> bool:
        stripped = text.strip()
        if not (stripped.startswith("{") and stripped.endswith("}")):
            return False
        try:
            parsed = json.loads(stripped)
        except ValueError:
            return False
        return isinstance(parsed, dict) and (
            "ok" in parsed or "tool_calls" in parsed or "items" in parsed or "created" in parsed
        )

    def _synthesize_reply_from_tools(self, executed_tools: list[tuple[str, dict[str, Any]]]) -> str:
        if not executed_tools:
            return "Mình đã ghi nhận yêu cầu."
        fn_name, result = executed_tools[-1]
        if not result.get("ok"):
            return f"⚠️ Không thể thực hiện: {result.get('error') or 'Dữ liệu không hợp lệ.'}"
        if fn_name == "create_quick_reminder" and isinstance(result.get("created"), dict):
            created = result["created"]
            title_str = str(created.get("title") or "")
            date_str = str(created.get("due_date") or "")
            time_part = f" lúc **{created['due_time']}**" if created.get("due_time") else ""
            return f"✅ Đã tạo nhắc việc **{title_str}** vào ngày **{date_str}**{time_part}."
        items = result.get("items")
        if isinstance(items, list):
            if not items:
                return "Hiện tại bạn chưa có mục nào khớp với yêu cầu."
            lines = [
                f"- **{item.get('title') or item.get('name') or 'Mục'}**"
                + (f" ({item['date']})" if item.get("date") else "")
                + (f" — {item['due_date']}" if item.get("due_date") else "")
                for item in items[:10]
                if isinstance(item, dict)
            ]
            if lines:
                return "\n".join(lines)
        return "Mình đã tra cứu và xử lý xong yêu cầu của bạn."

    def _tokens_used_today(self, owner_id: Any, tz_name: str) -> int:
        local_today = self.tz_service.local_today(tz_name)
        day_start_utc = self.tz_service.local_to_utc(local_today, dt_time.min, tz_name)
        return self.conversation_service.sum_tokens_since(owner_id, day_start_utc)

    def _assemble_llm_context(
        self,
        conversation_id: Any,
        *,
        tz_name: str,
        exclude_private: bool,
        hide_amounts: bool,
        allow_tools: bool,
        custom_policy: str = "",
    ) -> list[dict[str, Any]]:
        local_now = self.tz_service.local_now(tz_name)
        weekday = WEEKDAY_NAMES_VI[local_now.weekday()]
        prompt_parts = [
            SYSTEM_PROMPT,
            (
                f"Thời điểm hiện tại của người dùng: {weekday}, ngày {local_now.strftime('%Y-%m-%d')}, "
                f"giờ {local_now.strftime('%H:%M')} (múi giờ {local_now.tzinfo or tz_name})."
            ),
        ]
        cleaned_policy = (custom_policy or "").strip()
        if cleaned_policy:
            prompt_parts.append(f"Policy và phong cách trả lời ưu tiên của quản trị viên: {cleaned_policy}")
        if hide_amounts:
            prompt_parts.append("Đang ở nhóm chat Telegram: KHÔNG nêu con số tiền tệ nhạy cảm cụ thể.")
        if not allow_tools:
            prompt_parts.append(
                "Nhóm đang tắt đọc dữ liệu cá nhân: chỉ trả lời kiến thức chung, không đoán dữ liệu."
            )

        history = self.conversation_service.recent_context_messages(
            conversation_id,
            limit=AI_HISTORY_CONTEXT_LIMIT,
            exclude_private=exclude_private,
        )
        messages: list[dict[str, Any]] = [{"role": "system", "content": " ".join(prompt_parts)}]
        for msg in history:
            if msg.role not in (AssistantMessage.Role.USER, AssistantMessage.Role.ASSISTANT):
                continue
            if not msg.content or not msg.content.strip() or msg.tool_calls or msg.is_error:
                continue
            messages.append({"role": msg.role.lower(), "content": msg.content})
        return messages

    def _save_fallback(
        self, conversation: AssistantConversation, reason: str, *, code: str, attempts: int
    ) -> dict[str, Any]:
        cmds = ", ".join(SLASH_COMMAND_NAMES)
        body = f"{reason}\nBạn vẫn có thể dùng ngay các lệnh nhanh 0-token: {cmds}"
        saved = self.conversation_service.append_message(
            conversation,
            role=AssistantMessage.Role.ASSISTANT,
            content=body,
            model_used="fallback",
            tokens_used=0,
            contains_private_data=False,
            is_error=True,
        )
        return self._build_response(
            conversation,
            saved,
            is_fallback=True,
            fallback_attempts=attempts,
            fallback_code=code,
        )

    def _build_response(
        self,
        conversation: AssistantConversation,
        message: AssistantMessage,
        *,
        is_fallback: bool,
        fallback_attempts: int,
        fallback_code: str = "",
    ) -> dict[str, Any]:
        return {
            "conversation_id": str(conversation.pk),
            "conversation": conversation,
            "message": message,
            "reply": message.content,
            "model_used": message.model_used,
            "tokens_used": message.tokens_used,
            "contains_private_data": message.contains_private_data,
            "is_fallback": is_fallback,
            "fallback_attempts": fallback_attempts,
            "fallback_code": fallback_code,
        }
