"""Cấu hình app Journal."""

from app.core.registry.core_module_config import CoreModuleConfig


class JournalConfig(CoreModuleConfig):
    """App Journal (lịch sử thay đổi) và đăng ký module."""

    default = True
    name = "app.journal"
    label = "journal"
    verbose_name = "Journal"
