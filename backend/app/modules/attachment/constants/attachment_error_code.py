"""Mã lỗi của module Attachment. FE dịch theo giá trị; không đổi giá trị đã phát hành."""

from enum import StrEnum


class AttachmentErrorCode(StrEnum):
    """Mã lỗi của module Attachment."""

    ATTACHMENT_FOLDER_NAME_EXISTS = "ATTACHMENT_FOLDER_NAME_EXISTS"
    ATTACHMENT_FOLDER_CYCLE = "ATTACHMENT_FOLDER_CYCLE"
    ATTACHMENT_FOLDER_OWNER_MISMATCH = "ATTACHMENT_FOLDER_OWNER_MISMATCH"
