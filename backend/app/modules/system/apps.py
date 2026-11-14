"""Cấu hình app System."""

from app.core.registry.core_module_config import CoreModuleConfig


class SystemConfig(CoreModuleConfig):
    """App System: trạng thái module."""

    default = True
    name = "app.modules.system"
    label = "system"
    verbose_name = "System"
