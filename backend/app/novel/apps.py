"""Cấu hình app Novel."""

from app.core.registry.core_module_config import CoreModuleConfig


class NovelConfig(CoreModuleConfig):
    """App Novel và đăng ký module."""

    default = True
    name = "app.novel"
    label = "novel"
    verbose_name = "Novel"
