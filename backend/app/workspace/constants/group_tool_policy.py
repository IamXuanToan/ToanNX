"""Chính sách gọi công cụ dữ liệu cá nhân trong nhóm Telegram của Chatbot AI."""

from enum import StrEnum


class GroupToolPolicy(StrEnum):
    """Chính sách AI đọc dữ liệu cá nhân khi nhận câu hỏi từ nhóm Telegram."""

    DISABLED = "DISABLED"
    OWNER_ONLY = "OWNER_ONLY"
    ALL_MEMBERS = "ALL_MEMBERS"
