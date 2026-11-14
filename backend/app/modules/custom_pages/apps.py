"""Cấu hình app Custom Pages."""

from app.core.registry.core_module_config import CoreModuleConfig


class CustomPagesConfig(CoreModuleConfig):
    """App Custom Pages và đăng ký module."""

    default = True
    name = "app.modules.custom_pages"
    label = "custom_pages"
    verbose_name = "Custom Pages"
