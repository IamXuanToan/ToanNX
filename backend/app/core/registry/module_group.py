"""Nhóm module (dùng để gom hiển thị và tài liệu)."""

from enum import StrEnum


class ModuleGroup(StrEnum):
    """Nhóm module.

    - SYSTEM: hạ tầng dùng chung (iam, authentication, attachment, system, health).
    Thêm nhóm mới khi có module nghiệp vụ thực sự (ví dụ CONTENT cho Novel/CMS).
    """

    SYSTEM = "system"
    CONTENT = "content"
