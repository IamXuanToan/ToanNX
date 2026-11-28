"""Chặn yêu cầu ngoài phạm vi cá nhân (quản trị hệ thống, dữ liệu người khác) trước khi gọi LLM/tool."""

from app.core.utils.text import to_ascii
from app.workspace.constants.assistant_scope_rules import (
    ADMIN_ACCOUNT_PHRASES,
    ADMIN_OTHERS_PHRASES,
    ADMIN_SYSTEM_PHRASES,
    ASSISTANT_SCOPE_REFUSAL,
    PERSONAL_SCOPE_MARKERS,
)


class AssistantScopeGuard:
    """Luật bằng code, không phụ thuộc model: superuser/`manage_all` cũng chỉ thao tác dữ liệu của mình."""

    def refusal_for(self, text: str) -> str | None:
        """Câu từ chối nếu `text` là yêu cầu quản trị / dữ liệu người khác, ngược lại `None`."""
        padded = f" {self.normalize(text)} "
        if any(f" {phrase} " in padded for phrase in (*ADMIN_SYSTEM_PHRASES, *ADMIN_OTHERS_PHRASES)):
            return ASSISTANT_SCOPE_REFUSAL
        if any(f" {phrase} " in padded for phrase in ADMIN_ACCOUNT_PHRASES):
            if any(marker in padded for marker in PERSONAL_SCOPE_MARKERS):
                return None
            return ASSISTANT_SCOPE_REFUSAL
        return None

    def normalize(self, text: str) -> str:
        """Chữ thường không dấu, bỏ ký tự lạ, gộp khoảng trắng."""
        lowered = to_ascii(text or "").lower()
        cleaned = "".join(char if char.isalnum() else " " for char in lowered)
        return " ".join(cleaned.split())
