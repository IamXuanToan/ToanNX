"""Cấu hình app Health (không có model)."""

from app.core.registry.core_module_config import CoreModuleConfig


class HealthConfig(CoreModuleConfig):
    """App Health: liveness/readiness."""

    default = True
    name = "app.modules.health"
    label = "health"
    verbose_name = "Health"
