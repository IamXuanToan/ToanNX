"""Hợp đồng tool tạo mới của Trợ lý AI: các ô bắt buộc người dùng quyết định (luật nằm trong code)."""

from dataclasses import dataclass

from app.workspace.types.assistant_ask_slot import AssistantAskSlot


@dataclass(frozen=True)
class AssistantToolSpec:
    """Spec dựng từ model; thiếu ô nào trong `ask_slots` thì không tạo mà lập nháp hỏi lại."""

    tool: str
    title: str
    ask_slots: tuple[AssistantAskSlot, ...]
