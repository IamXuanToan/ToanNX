"""Cấu hình app Short Links."""

from app.core.registry.core_module_config import CoreModuleConfig


class ShortLinksConfig(CoreModuleConfig):
    """App Short Links và đăng ký module."""

    default = True
    name = "app.modules.short_links"
    label = "short_links"
    verbose_name = "Short Links"
