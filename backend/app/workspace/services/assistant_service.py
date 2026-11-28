"""Nghiệp vụ điều phối Trợ lý AI: 1 luồng Web duy nhất, config Bot từ Admin & xKiro Fallback."""

import json
import time
from datetime import date
from datetime import time as dt_time
from typing import Any

from app.core.constants.defaults import DEFAULT_TIMEZONE
from app.core.context.user_context import get_current_request
from app.system.utils.frontend_url import get_frontend_origin
from app.workspace.constants.assistant_record_links import ASSISTANT_RECORD_LINKS_BY_TYPE
from app.workspace.constants.assistant_training_prompt import ASSISTANT_CORE_SYSTEM_PROMPT
from app.workspace.constants.workspace_defaults import (
    AI_HISTORY_CONTEXT_LIMIT,
    AI_MAX_TOOL_ROUNDS,
    AI_REQUEST_DEADLINE_SECONDS,
    ASSISTANT_MASKED_SECRET_TEXT,
    DISPLAY_DATE_FORMAT,
    RECENT_RECORDS_LIMIT,
    SLASH_COMMAND_ALIASES,
    SLASH_COMMAND_NAMES,
)
from app.workspace.constants.workspace_error_code import WorkspaceErrorCode
from app.workspace.models.assistant_conversation import AssistantConversation
from app.workspace.models.assistant_message import AssistantMessage
from app.workspace.services.assistant_config_service import AssistantConfigService
from app.workspace.services.assistant_conversation_service import AssistantConversationService
from app.workspace.services.assistant_draft_service import AssistantDraftService
from app.workspace.services.assistant_knowledge_service import AssistantKnowledgeService
from app.workspace.services.assistant_reply_guard import AssistantReplyGuard
from app.workspace.services.assistant_result_card_builder import AssistantResultCardBuilder
from app.workspace.services.assistant_scope_guard import AssistantScopeGuard
from app.workspace.services.assistant_slash_service import AssistantSlashService
from app.workspace.services.assistant_tool_router import AssistantToolRouter
from app.workspace.services.assistant_tools_service import AssistantToolsService
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

SYSTEM_PROMPT = ASSISTANT_CORE_SYSTEM_PROMPT


class AssistantService:
    """Điều phối 1 luồng chat Web & kênh Telegram qua `xKiro`, 8 tool cá nhân & 7 lệnh Slash 0-token."""

    def __init__(
        self,
        conversation_service: AssistantConversationService | None = None,
        config_service: AssistantConfigService | None = None,
        tz_service: WorkspaceTimezoneService | None = None,
        xkiro_client: XkiroClient | None = None,
        tools_service: AssistantToolsService | None = None,
        slash_service: AssistantSlashService | None = None,
        draft_service: AssistantDraftService | None = None,
        result_card_builder: AssistantResultCardBuilder | None = None,
        reply_guard: AssistantReplyGuard | None = None,
        tool_router: AssistantToolRouter | None = None,
        scope_guard: AssistantScopeGuard | None = None,
        knowledge_service: AssistantKnowledgeService | None = None,
    ) -> None:
        """Khởi tạo service hội thoại, cấu hình Bot Admin, client AI và bộ tool."""
        self.conversation_service = conversation_service or AssistantConversationService()
        self.config_service = config_service or AssistantConfigService()
        self.tz_service = tz_service or WorkspaceTimezoneService()
        self.xkiro_client = xkiro_client or XkiroClient()
        self.tools_service = tools_service or AssistantToolsService()
        self.slash_service = slash_service or AssistantSlashService(
            tools_service=self.tools_service,
            tz_service=self.tz_service,
        )
        self.draft_service = draft_service or AssistantDraftService()
        self.result_card_builder = result_card_builder or AssistantResultCardBuilder()
        self.reply_guard = reply_guard or AssistantReplyGuard()
        self.tool_router = tool_router or AssistantToolRouter()
        self.scope_guard = scope_guard or AssistantScopeGuard()
        self.knowledge_service = knowledge_service or AssistantKnowledgeService()

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

        if not cmd and allow_personal_tools and is_owner:
            draft_res = self.draft_service.answer(conversation, cleaned)
            if draft_res is not None:
                return self._continue_draft(
                    owner,
                    conversation,
                    cleaned,
                    draft_res,
                    sender_telegram_id=sender_telegram_id,
                    sender_name=sender_name,
                    is_owner=is_owner,
                    hide_amounts=hide_amounts,
                )

        refusal = None if cmd else self.scope_guard.refusal_for(cleaned)
        if refusal is not None:
            # Chặn bằng code trước LLM/tool: kể cả superuser cũng chỉ thao tác dữ liệu cá nhân Client Portal.
            self.conversation_service.append_message(
                conversation,
                role=AssistantMessage.Role.USER,
                content=cleaned,
                sender_telegram_id=sender_telegram_id,
                sender_name=sender_name,
            )
            saved = self.conversation_service.append_message(
                conversation,
                role=AssistantMessage.Role.ASSISTANT,
                content=refusal,
                model_used="scope_guard",
                tokens_used=0,
                contains_private_data=False,
                is_error=False,
            )
            return self._build_response(conversation, saved, is_fallback=False, fallback_attempts=0)

        user_msg = self.conversation_service.append_message(
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

        bot_cfg = self.config_service.get_config()
        daily_limit = bot_cfg.get("ai_daily_token_limit")
        preferred_model = str(bot_cfg.get("preferred_ai_model") or "")
        custom_policy = str(bot_cfg.get("assistant_system_prompt") or "")

        if daily_limit is not None:
            used_today = self._tokens_used_today(owner.pk, DEFAULT_TIMEZONE)
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

        history = self.conversation_service.recent_context_messages(
            conversation.pk,
            limit=AI_HISTORY_CONTEXT_LIMIT,
            exclude_private=exclude_private_history,
        )
        llm_messages = self._assemble_llm_context(
            conversation.pk,
            tz_name=DEFAULT_TIMEZONE,
            exclude_private=exclude_private_history,
            hide_amounts=hide_amounts,
            allow_tools=allow_personal_tools,
            custom_policy=custom_policy,
            query_text=cleaned,
            history=history,
        )
        # Tool sửa của bản ghi vừa thao tác luôn có mặt để "đổi tên cái vừa tạo" không bị router lọc mất.
        recent_tools = tuple(
            link.update_tool
            for card in self._recent_cards(history)
            if (link := ASSISTANT_RECORD_LINKS_BY_TYPE.get(str(card.get("type") or ""))) and link.update_tool
        )
        tools = self.tool_router.select(
            self.tools_service.tool_schemas(is_owner=is_owner, actor=owner) if allow_personal_tools else None,
            cleaned,
            keep_tools=recent_tools,
        )

        deadline = time.monotonic() + AI_REQUEST_DEADLINE_SECONDS
        total_tokens = 0
        fallback_attempts = 0
        last_model = ""
        used_private_tool = False
        executed_tools: list[tuple[str, dict[str, Any]]] = []
        seen_signatures: set[str] = set()
        choice_request: dict[str, Any] | None = None

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
                    code=WorkspaceErrorCode.AI_UNAVAILABLE,
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
                reply_text, metadata = self._ground_reply(reply_text, llm_messages, executed_tools)
                saved = self.conversation_service.append_message(
                    conversation,
                    role=AssistantMessage.Role.ASSISTANT,
                    content=reply_text,
                    model_used=last_model,
                    tokens_used=total_tokens,
                    contains_private_data=used_private_tool,
                    is_error=False,
                    metadata=metadata,
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

            confirmation_requested = False
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
                    conversation_id=str(conversation.pk),
                    turn_id=str(user_msg.pk),
                    user_text=cleaned,
                )
                if tool_out.get("requires_confirmation") or tool_out.get("needs_clarification"):
                    confirmation_requested = True
                if isinstance(tool_out.get("needs_choice"), dict):
                    choice_request = tool_out
                    confirmation_requested = True
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
            if confirmation_requested:
                break

        if choice_request is not None:
            # Hỏi lựa chọn bằng câu do server dựng (0 token), không để model tự diễn giải lại.
            question = choice_request["needs_choice"]
            saved = self.conversation_service.append_message(
                conversation,
                role=AssistantMessage.Role.ASSISTANT,
                content=self._draft_question_text(question, choice_request.get("draft")),
                model_used=last_model,
                tokens_used=total_tokens,
                contains_private_data=True,
                is_error=False,
                metadata=self._question_metadata(question),
            )
            return self._build_response(
                conversation, saved, is_fallback=False, fallback_attempts=fallback_attempts
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
                code=WorkspaceErrorCode.AI_UNAVAILABLE,
                attempts=fallback_attempts,
            )
        reply_text, final_metadata = self._ground_reply(reply_text, llm_messages, executed_tools)

        saved = self.conversation_service.append_message(
            conversation,
            role=AssistantMessage.Role.ASSISTANT,
            content=reply_text,
            model_used=last_model,
            tokens_used=total_tokens,
            contains_private_data=used_private_tool,
            is_error=False,
            metadata=final_metadata,
        )
        return self._build_response(
            conversation, saved, is_fallback=False, fallback_attempts=fallback_attempts
        )

    # ------------------------------------------------------------------ Nháp → chọn → tạo & grounding
    def _continue_draft(
        self,
        owner: Any,
        conversation: AssistantConversation,
        cleaned: str,
        draft_res: dict[str, Any],
        *,
        sender_telegram_id: int | None,
        sender_name: str,
        is_owner: bool,
        hide_amounts: bool,
    ) -> dict[str, Any]:
        """Ghép câu trả lời vào nháp đang chờ: hỏi ô kế tiếp hoặc thực thi tool khi đã đủ (0 token)."""
        is_secret = bool(draft_res.get("secret"))
        user_msg = self.conversation_service.append_message(
            conversation,
            role=AssistantMessage.Role.USER,
            content=ASSISTANT_MASKED_SECRET_TEXT if is_secret else cleaned,
            sender_telegram_id=sender_telegram_id,
            sender_name=sender_name,
            contains_private_data=is_secret,
        )
        if not draft_res.get("done"):
            question = draft_res["question"]
            saved = self.conversation_service.append_message(
                conversation,
                role=AssistantMessage.Role.ASSISTANT,
                content=self._draft_question_text(question, None),
                model_used="draft",
                tokens_used=0,
                contains_private_data=False,
                is_error=False,
                metadata=self._question_metadata(question),
            )
            return self._build_response(conversation, saved, is_fallback=False, fallback_attempts=0)

        tool_name = str(draft_res["tool"])
        tool_out = self.tools_service.execute_tool(
            owner,
            tool_name,
            {**draft_res["args"], "slot_values": draft_res["chosen"]},
            is_owner=is_owner,
            hide_amounts=hide_amounts,
            conversation_id=str(conversation.pk),
            turn_id=str(user_msg.pk),
        )
        executed = [(tool_name, tool_out)]
        cards = self.result_card_builder.build(executed)
        reply_text = self._compose_with_cards(self._synthesize_reply_from_tools(executed), cards)
        saved = self.conversation_service.append_message(
            conversation,
            role=AssistantMessage.Role.ASSISTANT,
            content=reply_text,
            model_used="draft",
            tokens_used=0,
            contains_private_data=True,
            is_error=not tool_out.get("ok"),
            metadata={"cards": cards} if cards else {},
        )
        response = self._build_response(conversation, saved, is_fallback=False, fallback_attempts=0)
        response["user_input_masked"] = is_secret
        return response

    def cancel_pending(self, conversation_id: str) -> None:
        """Bỏ nháp / yêu cầu xác nhận đang chờ của hội thoại (VD không thu mật khẩu trong nhóm Telegram)."""
        self.draft_service.confirmation_service.clear(conversation_id)

    def _draft_question_text(self, question: dict[str, Any], draft: Any) -> str:
        """Tóm tắt nháp + câu hỏi gọn; lựa chọn hiện bằng nút (Web: chip, Telegram: nút inline) nên không lặp
        danh sách trong nội dung. Trả lời bằng số thứ tự hoặc gõ "N đơn vị" vẫn được hiểu.

        Phần tóm tắt nháp dùng nhãn `verbose_name` của model nên áp dụng chung cho mọi tool tạo mới.
        """
        lines: list[str] = []
        if isinstance(draft, dict) and draft.get("title"):
            fields = draft.get("fields") or []
            kind = str(draft["title"]).lower()
            lines.append(f"📝 Mình đã chuẩn bị **{kind}** mới:" if fields else f"📝 Tạo **{kind}** mới.")
            lines.extend(f"- {row['label']}: **{row['value']}**" for row in fields)
            lines.extend(str(note) for note in draft.get("notes") or [])
            lines.append("")
        lines.append(f"**{question.get('question')}**")
        if question.get("accepts_number") and question.get("unit"):
            lines.append(f"Chọn nhanh bên dưới hoặc gõ số {question['unit']} khác.")
        return "\n".join(lines)

    def _question_metadata(self, question: dict[str, Any]) -> dict[str, Any]:
        """Nút lựa chọn + ô nhập nhanh (số kèm đơn vị / chữ / bí mật) cho câu hỏi đang chờ."""
        metadata: dict[str, Any] = {"quick_replies": self._quick_replies(question)}
        quick_input = self._quick_input(question)
        if quick_input is not None:
            metadata["quick_input"] = quick_input
        return metadata

    def _quick_input(self, question: dict[str, Any]) -> dict[str, Any] | None:
        """Ô nhập trực tiếp: `secret` (mật khẩu), `text` (gõ tự do, ngày, giờ), `number` (số kèm đơn vị)."""
        custom_placeholder = str(question.get("placeholder") or "")
        if question.get("free_text") or question.get("input_kind") in ("time", "date"):
            kind = "secret" if question.get("secret") else "text"
            placeholder = custom_placeholder or ("Nhập mật khẩu…" if kind == "secret" else "Nhập nội dung…")
            return {"kind": kind, "unit": "", "placeholder": placeholder}
        if question.get("accepts_number") and question.get("unit"):
            unit = str(question["unit"])
            return {"kind": "number", "unit": unit, "placeholder": f"Số {unit} khác"}
        return None

    def _quick_replies(self, question: dict[str, Any]) -> list[dict[str, str]]:
        """Nút trả lời nhanh: bấm là gửi đúng nhãn lựa chọn."""
        return [
            {"caption": str(option.get("label") or ""), "text": str(option.get("label") or "")}
            for option in question.get("options") or []
        ]

    def _ground_reply(
        self,
        reply_text: str,
        llm_messages: list[dict[str, Any]],
        executed_tools: list[tuple[str, dict[str, Any]]],
    ) -> tuple[str, dict[str, Any]]:
        """Có thẻ kết quả → dùng nội dung server dựng; không thì gỡ URL không có trong ngữ cảnh lượt này."""
        cards = self.result_card_builder.build(executed_tools)
        trusted = [
            str(msg.get("content") or "") for msg in llm_messages if isinstance(msg.get("content"), str)
        ]
        trusted.extend(json.dumps(out, ensure_ascii=False) for _, out in executed_tools)
        origin = get_frontend_origin(get_current_request(), prefer_configured=True)
        guarded = self.reply_guard.sanitize(reply_text, trusted_texts=trusted, origin=origin, cards=cards)
        if not cards:
            return guarded, {}
        return self._compose_with_cards(guarded, cards), {"cards": cards}

    def _compose_with_cards(self, lead: str, cards: list[dict[str, Any]]) -> str:
        """Ghép lời dẫn + thẻ kết quả.

        Link xem lại CHỈ nằm ở thẻ (Web vẽ nút, Telegram tự gắn một dòng khi gửi), nên mọi link Portal
        model tự chép vào lời dẫn đều bị gỡ để không lặp "Xem chi tiết".
        """
        if not cards:
            return lead
        if self.result_card_builder.has_full_summary(cards):
            return self.result_card_builder.to_markdown(cards)
        cleaned = self.result_card_builder.strip_view_links(lead, cards)
        return cleaned or self.result_card_builder.to_markdown(cards)

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
        cleaned = self.reply_guard.strip_tool_markup(raw_text or "")
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
        if result.get("requires_confirmation"):
            summary = str(result.get("target_summary") or "mục đã chọn")
            return (
                f"⚠️ Bạn có chắc chắn muốn xóa **{summary}** không?\n"
                "Hãy trả lời **Đồng ý xóa** (hoặc **Xác nhận**) để mình thực hiện."
            )
        if result.get("needs_clarification"):
            return str(result.get("error") or "Mình cần bạn xác nhận thêm thông tin trước khi thực hiện.")
        if not result.get("ok"):
            return f"⚠️ Không thể thực hiện: {result.get('error') or 'Dữ liệu không hợp lệ.'}"
        if fn_name == "create_quick_reminder" and isinstance(result.get("created"), dict):
            created = result["created"]
            title_str = str(created.get("title") or "")
            date_str = self._display_date(created.get("due_date"))
            time_part = f" lúc **{created['due_time']}**" if created.get("due_time") else ""
            notify_mins = created.get("notify_minutes_before")
            notify_part = f" (báo trước **{notify_mins} phút**)" if notify_mins else ""
            return f"✅ Đã tạo nhắc việc **{title_str}** vào ngày **{date_str}**{time_part}{notify_part}."
        if fn_name == "create_finance_income" and isinstance(result.get("created"), dict):
            created = result["created"]
            amt = f"{int(created.get('amount_vnd') or 0):,}".replace(",", ".")
            received = self._display_date(created.get("received_date"))
            return (
                f"✅ Đã ghi nhận thu nhập **{amt} đ** từ **{created.get('platform')}** "
                f"(ngày **{received}**, nội dung: {created.get('content')})."
            )
        if fn_name == "delete_personal_record" and isinstance(result.get("deleted"), dict):
            return f"🗑️ Đã xóa {result['deleted'].get('summary') or 'mục đã chọn'}."
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

    def _display_date(self, value: Any) -> str:
        """Ngày ISO (`YYYY-MM-DD`) → `dd/MM/yyyy` theo chuẩn hiển thị; giá trị lạ giữ nguyên."""
        raw = str(value or "")
        try:
            return date.fromisoformat(raw[:10]).strftime(DISPLAY_DATE_FORMAT)
        except ValueError:
            return raw

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
        query_text: str = "",
        history: list[AssistantMessage] | None = None,
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

        # RAG: đoạn hướng dẫn Client Portal liên quan câu hỏi (nhóm Telegram không gửi câu hỏi sang Gemini).
        knowledge = self.knowledge_service.prompt_block(query_text, use_vector=not exclude_private)
        if knowledge:
            prompt_parts.append("\n\n" + knowledge)

        if history is None:
            history = self.conversation_service.recent_context_messages(
                conversation_id,
                limit=AI_HISTORY_CONTEXT_LIMIT,
                exclude_private=exclude_private,
            )
        recent_block = self._recent_records_block(history)
        if recent_block:
            prompt_parts.append("\n\n" + recent_block)
        messages: list[dict[str, Any]] = [{"role": "system", "content": " ".join(prompt_parts)}]
        for msg in history:
            if msg.role not in (AssistantMessage.Role.USER, AssistantMessage.Role.ASSISTANT):
                continue
            if not msg.content or not msg.content.strip() or msg.tool_calls or msg.is_error:
                continue
            messages.append({"role": msg.role.lower(), "content": msg.content})
        return messages

    def _recent_cards(self, history: list[AssistantMessage]) -> list[dict[str, Any]]:
        """Thẻ kết quả (bản ghi đã tạo/sửa) trong lịch sử gần, mới nhất trước, mỗi bản ghi một lần."""
        seen: set[str] = set()
        cards: list[dict[str, Any]] = []
        for msg in reversed(history):
            metadata = msg.metadata if isinstance(msg.metadata, dict) else {}
            for card in reversed(metadata.get("cards") or []):
                if not isinstance(card, dict) or not card.get("id") or str(card["id"]) in seen:
                    continue
                seen.add(str(card["id"]))
                cards.append(card)
        return cards

    def _recent_records_block(self, history: list[AssistantMessage]) -> str:
        """Bản ghi vừa tạo/sửa trong hội thoại (từ thẻ kết quả đã lưu) kèm ID + tool sửa, mới nhất trước.

        Giúp model hiểu "đổi tên cái vừa tạo", "sửa giờ nhắc đó", "xóa link đó" mà không phải tra cứu lại hay
        tự xóa rồi tạo lại bản ghi.
        """
        lines: list[str] = []
        for card in self._recent_cards(history)[:RECENT_RECORDS_LIMIT]:
            link = ASSISTANT_RECORD_LINKS_BY_TYPE.get(str(card.get("type") or ""))
            if link is None or not link.update_tool:
                continue
            action = "vừa tạo" if card.get("action") == "created" else "vừa sửa"
            title = f' "{card["title"]}"' if card.get("title") else ""
            resource_arg = f'resource="{link.card_type}", ' if link.update_tool == "update_my_record" else ""
            lines.append(
                f"- {link.label}{title} ({action}) → sửa: "
                f'`{link.update_tool}({resource_arg}{link.id_arg}="{card["id"]}")`; '
                f'xóa: `delete_personal_record(resource_type="{link.card_type}", record_id="{card["id"]}")`'
            )
        if not lines:
            return ""
        return (
            'BẢN GHI VỪA THAO TÁC TRONG HỘI THOẠI (mới nhất trước). Khi người dùng nói "cái đó", "vừa tạo", '
            '"đổi tên", "sửa giờ"... thì dùng ĐÚNG ID dưới đây với tool `update_*`; đổi/sửa thì KHÔNG '
            "xóa rồi "
            "tạo lại:\n" + "\n".join(lines)
        )

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
