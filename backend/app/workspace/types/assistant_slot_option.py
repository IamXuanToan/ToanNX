"""Một lựa chọn của ô cần hỏi (slot) khi Trợ lý AI lập nháp thao tác ghi."""

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class AssistantSlotOption:
    """Lựa chọn hiển thị thành nút; `value` là giá trị thật ghi vào tham số tool (str/int/bool/list/None)."""

    label: str
    value: Any
    hints: tuple[str, ...] = ()
