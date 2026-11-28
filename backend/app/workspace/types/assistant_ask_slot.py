"""Ô thông tin người dùng phải tự quyết trước khi Trợ lý AI tạo bản ghi (dựng sẵn từ metadata model)."""

from dataclasses import dataclass
from typing import Any

from app.workspace.types.assistant_number_unit import AssistantNumberUnit
from app.workspace.types.assistant_slot_option import AssistantSlotOption


@dataclass(frozen=True)
class AssistantAskSlot:
    """Câu hỏi + lựa chọn; `free_text` nhận nguyên văn, `secret` che tin trả lời khỏi lịch sử gửi LLM."""

    name: str
    question: str
    options: tuple[AssistantSlotOption, ...] = ()
    free_text: bool = False
    secret: bool = False
    only_if: tuple[str, Any] | None = None
    units: tuple[AssistantNumberUnit, ...] = ()
    context_words: tuple[str, ...] = ()
    min_value: int | None = None
    max_value: int | None = None
    list_value: bool = False
    when_arg_present: str = ""
    when_arg_absent: str = ""
    internal: bool = False
    value_kind: str = ""
    generic_values: tuple[str, ...] = ()
    placeholder: str = ""
