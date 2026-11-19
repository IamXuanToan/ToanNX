"""Mã lỗi của module Novel. FE dịch theo giá trị; không đổi giá trị đã phát hành."""

from enum import StrEnum


class NovelErrorCode(StrEnum):
    """Mã lỗi của module Novel."""

    NOVEL_NOT_FOUND = "NOVEL_NOT_FOUND"
    NOVEL_SLUG_EXISTS = "NOVEL_SLUG_EXISTS"
    NOVEL_FORBIDDEN = "NOVEL_FORBIDDEN"
    NOVEL_IMPORT_INVALID = "NOVEL_IMPORT_INVALID"
    CHAPTER_NOT_FOUND = "CHAPTER_NOT_FOUND"
    CHAPTER_NUMBER_EXISTS = "CHAPTER_NUMBER_EXISTS"
