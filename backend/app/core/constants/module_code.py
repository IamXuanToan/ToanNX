"""Mã định danh các module nghiệp vụ trong backend (khớp `CoreModuleConfig.label`)."""

from enum import StrEnum


class ModuleCode(StrEnum):
    """Mã module duy nhất dùng cho cấu hình khóa theo module (`rate limit`, ...)."""

    SYSTEM = "system"
    NOVEL = "novel"
    UTILITIES = "utilities"
    FINANCE = "finance"
    WORKSPACE = "workspace"
