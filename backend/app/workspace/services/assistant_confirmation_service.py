"""Hành động chờ xác nhận của Trợ lý AI (xóa 2 bước, nháp tạo mới) lưu trên `AssistantConversation`.

Trước đây trạng thái nằm trong `django.core.cache` (mặc định `LocMemCache` theo từng process) nên mất khi lượt
xác nhận rơi vào instance serverless khác. Nay PostgreSQL là nguồn đúng: hội thoại vốn được nạp mỗi lượt chat.
"""

import secrets
import uuid
from datetime import timedelta
from typing import Any

from django.utils import timezone

from app.workspace.constants.workspace_defaults import ASSISTANT_PENDING_ACTION_TTL_SECONDS
from app.workspace.models.assistant_conversation import AssistantConversation
from app.workspace.repositories.assistant_conversation_repository import (
    AssistantConversationRepository,
)

PENDING_KIND_DELETE = "DELETE"
PENDING_KIND_DRAFT = "DRAFT"


class AssistantConfirmationService:
    """Ghi/đọc/tiêu thụ đúng 1 hành động chờ cho mỗi hội thoại; chặn AI tự xác nhận trong cùng lượt."""

    def __init__(self, conversation_repository: AssistantConversationRepository | None = None) -> None:
        """Khởi tạo repository hội thoại (nơi lưu `pending_action`)."""
        self.conversation_repository = conversation_repository or AssistantConversationRepository()

    # ------------------------------------------------------------------ Xóa 2 bước
    def stage(
        self,
        *,
        conversation_id: str,
        owner_id: Any,
        resource_type: str,
        record_id: str,
        summary: str,
        turn_id: str,
    ) -> None:
        """Ghi nhận yêu cầu xóa chờ người dùng xác nhận ở lượt chat kế tiếp."""
        self._write(
            conversation_id,
            {
                "kind": PENDING_KIND_DELETE,
                "owner_id": str(owner_id),
                "resource_type": resource_type,
                "record_id": str(record_id),
                "summary": summary,
                "turn_id": str(turn_id),
            },
        )

    def verify_and_consume(
        self,
        *,
        conversation_id: str,
        owner_id: Any,
        resource_type: str,
        record_id: str,
        current_turn_id: str,
    ) -> tuple[bool, str]:
        """Kiểm xác nhận xóa hợp lệ từ lượt trước; đúng thì xóa trạng thái chờ và cho phép thực thi."""
        if not conversation_id:
            return False, "Thiếu ngữ cảnh hội thoại để xác nhận thao tác xóa."
        pending = self.read(conversation_id)
        if pending is None or pending.get("kind") != PENDING_KIND_DELETE:
            return False, "Chưa có yêu cầu xác nhận xóa hợp lệ hoặc yêu cầu đã hết hạn."
        if pending.get("owner_id") != str(owner_id):
            return False, "Yêu cầu xác nhận không thuộc chủ sở hữu hiện tại."
        if pending.get("resource_type") != resource_type or pending.get("record_id") != str(record_id):
            return False, "Mục cần xóa không khớp với mục đã hỏi xác nhận trước đó."
        if pending.get("turn_id") == str(current_turn_id):
            return False, "Phải chờ người dùng xác nhận ở lượt trả lời tiếp theo mới được xóa."
        self.clear(conversation_id)
        return True, ""

    # ------------------------------------------------------------------ Nháp tạo mới
    def stage_draft(
        self,
        *,
        conversation_id: str,
        owner_id: Any,
        tool: str,
        args: dict[str, Any],
        pending_slots: list[str],
        chosen: dict[str, Any],
        turn_id: str,
    ) -> str:
        """Lưu nháp (đã bỏ mật khẩu) và trả `draft_token`; rỗng nếu không có hội thoại để lưu."""
        token = secrets.token_urlsafe(16)
        saved = self._write(
            conversation_id,
            {
                "kind": PENDING_KIND_DRAFT,
                "token": token,
                "owner_id": str(owner_id),
                "tool": tool,
                "args": args,
                "pending_slots": list(pending_slots),
                "chosen": chosen,
                "turn_id": str(turn_id),
            },
        )
        return token if saved else ""

    def update_draft(self, conversation_id: str, draft: dict[str, Any]) -> None:
        """Ghi lại nháp sau khi người dùng chọn thêm một lựa chọn (gia hạn thời gian chờ)."""
        self._write(conversation_id, draft)

    def read(self, conversation_id: str) -> dict[str, Any] | None:
        """Hành động đang chờ còn hạn của hội thoại, hoặc `None`."""
        conversation = self._find(conversation_id)
        if conversation is None:
            return None
        return self.read_from(conversation)

    def read_from(self, conversation: AssistantConversation) -> dict[str, Any] | None:
        """Đọc hành động chờ từ instance đã nạp sẵn (không query thêm)."""
        pending = conversation.pending_action
        expires_at = conversation.pending_expires_at
        if not isinstance(pending, dict) or expires_at is None or expires_at <= timezone.now():
            return None
        return dict(pending)

    def clear(self, conversation_id: str) -> None:
        """Bỏ hành động đang chờ của hội thoại."""
        pk = self._parse_pk(conversation_id)
        if pk is None:
            return
        self.conversation_repository.update_where({"pending_action": None, "pending_expires_at": None}, pk=pk)

    # ------------------------------------------------------------------ Nội bộ
    def _write(self, conversation_id: str, payload: dict[str, Any]) -> bool:
        pk = self._parse_pk(conversation_id)
        if pk is None:
            return False
        expires_at = timezone.now() + timedelta(seconds=ASSISTANT_PENDING_ACTION_TTL_SECONDS)
        updated = self.conversation_repository.update_where(
            {"pending_action": payload, "pending_expires_at": expires_at}, pk=pk
        )
        return updated > 0

    def _find(self, conversation_id: str) -> AssistantConversation | None:
        pk = self._parse_pk(conversation_id)
        if pk is None:
            return None
        return self.conversation_repository.find_one(pk=pk)

    def _parse_pk(self, conversation_id: str) -> uuid.UUID | None:
        try:
            return uuid.UUID(str(conversation_id))
        except (TypeError, ValueError):
            return None
