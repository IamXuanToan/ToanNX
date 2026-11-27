"""Nghiệp vụ Hội thoại Trợ lý AI: 1 luồng Web duy nhất cho mỗi user & giữ ngữ cảnh Telegram."""

from datetime import datetime
from typing import Any

from django.db import transaction
from django.utils import timezone

from app.core.services.core_crud_service import CoreCrudService
from app.workspace.constants.workspace_defaults import AI_INITIAL_MESSAGES_LIMIT
from app.workspace.models.assistant_conversation import AssistantConversation
from app.workspace.models.assistant_message import AssistantMessage
from app.workspace.permissions.assistant_config_permission import AssistantConfigPermission
from app.workspace.repositories.assistant_conversation_repository import (
    AssistantConversationRepository,
)
from app.workspace.repositories.assistant_message_repository import AssistantMessageRepository


class AssistantConversationService(CoreCrudService[AssistantConversation, AssistantConversationRepository]):
    """Đọc/làm mới luồng chat Web duy nhất và đóng gói đọc/ghi `AssistantMessage`."""

    repository_class = AssistantConversationRepository
    owner_field = "owner"
    manage_all_permission = AssistantConfigPermission.READ.code

    def __init__(
        self,
        repository: AssistantConversationRepository | None = None,
        message_repository: AssistantMessageRepository | None = None,
    ) -> None:
        """Khởi tạo repository hội thoại và repository tin nhắn."""
        super().__init__(repository or AssistantConversationRepository())
        self.message_repository = message_repository or AssistantMessageRepository()

    @transaction.atomic
    def get_or_create_web_thread(self, owner: Any) -> AssistantConversation:
        """Trả về đúng 1 hội thoại Web duy nhất của `owner` (tạo mới nếu chưa có)."""
        existing = self.repository.find_web_thread(owner.pk)
        if existing is not None:
            return existing
        return self.repository.create(
            actor=owner,
            owner=owner,
            channel=AssistantConversation.Channel.WEB,
            external_chat_id="",
            title="Trợ lý AI",
            last_message_at=timezone.now(),
        )

    @transaction.atomic
    def get_or_create_active(
        self,
        owner: Any,
        *,
        channel: str,
        external_chat_id: str = "",
        title: str = "",
    ) -> AssistantConversation:
        """Tìm hoặc mở phiên hội thoại phù hợp cho Web (1 luồng) hoặc kênh Telegram."""
        if channel == AssistantConversation.Channel.WEB:
            return self.get_or_create_web_thread(owner)
        if external_chat_id:
            existing = self.repository.find_for_channel(owner.pk, channel, external_chat_id)
            if existing is not None:
                return existing
        return self.repository.create(
            actor=owner,
            owner=owner,
            channel=channel,
            external_chat_id=external_chat_id,
            title=title[:200],
            last_message_at=timezone.now(),
        )

    def get_web_thread_messages(
        self, actor: Any, *, page: int = 1, page_size: int = AI_INITIAL_MESSAGES_LIMIT
    ) -> dict[str, Any]:
        """Lấy lịch sử tin nhắn hiển thị trong đúng 1 luồng chat Web của `actor` (ẩn bước gọi Tool nội bộ)."""
        thread = self.repository.find_web_thread(actor.pk)
        if thread is None:
            return {"messages": [], "has_more_messages": False, "total_messages": 0}
        safe_page = max(1, int(page))
        safe_size = max(1, min(100, int(page_size)))
        qs = self.message_repository.visible_queryset_for_conversation(thread.pk)
        total = qs.count()
        offset = (safe_page - 1) * safe_size
        rows = list(qs[offset : offset + safe_size + 1])
        has_more = len(rows) > safe_size
        items = list(reversed(rows[:safe_size]))
        return {
            "messages": items,
            "has_more_messages": has_more,
            "total_messages": total,
        }

    @transaction.atomic
    def clear_conversation(self, conversation: AssistantConversation, *, actor: Any) -> int:
        """Xóa toàn bộ tin nhắn thuộc một hội thoại bất kỳ (Web hoặc Telegram)."""
        deleted = self.message_repository.hard_delete_where(conversation_id=conversation.pk)
        self.repository.update(conversation, actor=actor, last_message_at=timezone.now())
        return deleted

    @transaction.atomic
    def clear_web_thread(self, actor: Any) -> int:
        """Xóa toàn bộ tin nhắn trong luồng chat Web duy nhất của `actor` (bắt đầu lại màn sạch)."""
        thread = self.repository.find_web_thread(actor.pk)
        if thread is None:
            return 0
        return self.clear_conversation(thread, actor=actor)

    @transaction.atomic
    def append_message(
        self,
        conversation: AssistantConversation,
        *,
        role: str,
        content: str = "",
        sender_telegram_id: int | None = None,
        sender_name: str = "",
        tool_calls: Any = None,
        tool_call_id: str = "",
        model_used: str = "",
        tokens_used: int = 0,
        contains_private_data: bool = False,
        is_error: bool = False,
    ) -> AssistantMessage:
        """Thêm tin nhắn vào hội thoại và cập nhật mốc `last_message_at`."""
        now = timezone.now()
        msg = self.message_repository.create(
            conversation=conversation,
            role=role,
            content=content,
            sender_telegram_id=sender_telegram_id,
            sender_name=sender_name[:150],
            tool_calls=tool_calls,
            tool_call_id=tool_call_id[:100],
            model_used=model_used[:120],
            tokens_used=max(0, int(tokens_used)),
            contains_private_data=contains_private_data,
            is_error=is_error,
        )
        updates: dict[str, Any] = {"last_message_at": now}
        if not conversation.title and role == AssistantMessage.Role.USER and content:
            updates["title"] = content[:120]
        self.repository.update(conversation, **updates)
        return msg

    def recent_context_messages(
        self, conversation_id: Any, *, limit: int = 10, exclude_private: bool = False
    ) -> list[AssistantMessage]:
        """Nạp tối đa `limit` lượt hỏi-đáp sạch gần nhất cho ngữ cảnh LLM (lọc private nếu ở Group)."""
        rows = self.message_repository.list_recent_chat_turns(conversation_id, limit=limit * 2)
        if exclude_private:
            rows = [msg for msg in rows if not msg.contains_private_data]
        return rows[-limit:]

    def sum_tokens_since(self, owner_id: Any, since_dt: datetime) -> int:
        """Tổng token AI mà `owner` đã sử dụng từ mốc `since_dt`."""
        return self.message_repository.sum_tokens_since(owner_id, since_dt)
