"""Nghiệp vụ Hội thoại Trợ lý AI (tải 50 tin gần nhất + phân trang lịch sử cũ)."""

from typing import Any

from django.db import transaction
from django.db.models import QuerySet
from django.utils import timezone

from app.core.services.core_crud_service import CoreCrudService
from app.workspace.constants.workspace_defaults import AI_INITIAL_MESSAGES_LIMIT
from app.workspace.models.assistant_conversation import AssistantConversation
from app.workspace.models.assistant_message import AssistantMessage
from app.workspace.permissions.assistant_conversation_permission import AssistantConversationPermission
from app.workspace.repositories.assistant_conversation_repository import (
    AssistantConversationRepository,
)
from app.workspace.repositories.assistant_message_repository import AssistantMessageRepository


class AssistantConversationService(CoreCrudService[AssistantConversation, AssistantConversationRepository]):
    """Đọc/xóa phiên hội thoại và đóng gói đọc/ghi `AssistantMessage` không tạo service riêng."""

    repository_class = AssistantConversationRepository
    owner_field = "owner"
    manage_all_permission = AssistantConversationPermission.MANAGE_ALL.code

    def __init__(
        self,
        repository: AssistantConversationRepository | None = None,
        message_repository: AssistantMessageRepository | None = None,
    ) -> None:
        """Khởi tạo repository hội thoại và repository tin nhắn."""
        super().__init__(repository or AssistantConversationRepository())
        self.message_repository = message_repository or AssistantMessageRepository()

    def retrieve_with_recent_messages(
        self, actor: Any, pk: Any
    ) -> tuple[AssistantConversation, list[AssistantMessage], bool]:
        """Trả chi tiết hội thoại kèm tối đa 50 tin gần nhất & cờ `has_more_messages`."""
        conversation = self.get_by_id_for(actor, pk)
        items, has_more = self.message_repository.list_recent(
            conversation.pk, limit=AI_INITIAL_MESSAGES_LIMIT
        )
        return conversation, items, has_more

    def messages_queryset_for(self, actor: Any, pk: Any) -> QuerySet[AssistantMessage]:
        """Queryset phân trang cho `GET /assistant/conversations/{id}/messages`."""
        conversation = self.get_by_id_for(actor, pk)
        return self.message_repository.queryset_for_conversation(conversation.pk)

    @transaction.atomic
    def get_or_create_active(
        self,
        owner: Any,
        *,
        channel: str,
        external_chat_id: str = "",
        conversation_id: Any | None = None,
        force_new: bool = False,
        title: str = "",
    ) -> AssistantConversation:
        """Tìm hoặc mở phiên hội thoại phù hợp cho Web hoặc Telegram."""
        if conversation_id is not None and not force_new:
            return self.get_by_id_for(owner, conversation_id)
        if not force_new and external_chat_id:
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

    @transaction.atomic
    def create_new_channel_session(
        self, owner: Any, *, channel: str, external_chat_id: str = "", title: str = ""
    ) -> AssistantConversation:
        """Tạo phiên hội thoại mới (dùng cho lệnh `/newchat`)."""
        return self.repository.create(
            actor=owner,
            owner=owner,
            channel=channel,
            external_chat_id=external_chat_id,
            title=title[:200] or "Cuộc trò chuyện mới",
            last_message_at=timezone.now(),
        )

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
        """Thêm tin nhắn vào hội thoại và cập nhật mốc `last_message_at` + tiêu đề nếu còn trống."""
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
        update_fields: dict[str, Any] = {"last_message_at": now}
        if not conversation.title and role == AssistantMessage.Role.USER and content.strip():
            update_fields["title"] = content.strip()[:120]
        self.repository.update(conversation, **update_fields)
        return msg

    def recent_context_messages(
        self, conversation_id: Any, *, limit: int = 10, exclude_private: bool = False
    ) -> list[AssistantMessage]:
        """Lấy lịch sử ngắn gửi lên LLM; lọc bỏ `contains_private_data=True` khi chạy chế độ an toàn."""
        items, _ = self.message_repository.list_recent(conversation_id, limit=limit)
        if exclude_private:
            return [m for m in items if not m.contains_private_data]
        return items

    def sum_tokens_since(self, owner_id: Any, since_dt: Any) -> int:
        """Tổng token tiêu thụ từ `since_dt` của `owner`."""
        return self.message_repository.sum_tokens_since(owner_id, since_dt)
