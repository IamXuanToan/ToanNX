"""Kích thước nút tròn Chatbot AI nổi trên giao diện Portal."""

from enum import StrEnum


class AssistantLauncherSize(StrEnum):
    """Ba mức kích thước nút tròn nổi do Admin cấu hình."""

    SMALL = "sm"
    MEDIUM = "md"
    LARGE = "lg"
