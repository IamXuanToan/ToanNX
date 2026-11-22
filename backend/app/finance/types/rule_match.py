"""Kết quả so một nội dung với quy tắc."""

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class RuleMatch:
    """Quy tắc khớp + đoạn khớp (để FE tô sáng)."""

    rule: Any
    matched_text: str
