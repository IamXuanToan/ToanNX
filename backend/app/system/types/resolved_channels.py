"""Kênh nhận một sự kiện của một người sau khi áp tùy chọn + mặc định."""

from dataclasses import dataclass, field
from typing import Any


@dataclass
class ResolvedChannels:
    """`in_app` quyết định có hiện trong chuông; `chat_ids` là các chat Telegram nhận."""

    in_app: bool = False
    push: bool = False
    email: bool = False
    chat_ids: list[Any] = field(default_factory=list)

    @property
    def any(self) -> bool:
        """Có ít nhất một kênh."""
        return self.in_app or self.push or self.email or bool(self.chat_ids)
