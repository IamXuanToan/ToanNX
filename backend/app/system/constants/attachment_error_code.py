"""Mã lỗi phần Thư viện (module System). FE dịch theo giá trị; không đổi giá trị đã phát hành."""

from enum import StrEnum


class AttachmentErrorCode(StrEnum):
    """Mã lỗi phần Thư viện (module System)."""

    ATTACHMENT_FOLDER_NAME_EXISTS = "ATTACHMENT_FOLDER_NAME_EXISTS"
    ATTACHMENT_FOLDER_CYCLE = "ATTACHMENT_FOLDER_CYCLE"
    ATTACHMENT_FOLDER_OWNER_MISMATCH = "ATTACHMENT_FOLDER_OWNER_MISMATCH"
    ATTACHMENT_STORAGE_QUOTA_EXCEEDED = "ATTACHMENT_STORAGE_QUOTA_EXCEEDED"
