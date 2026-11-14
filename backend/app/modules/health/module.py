"""Khai báo module Health (đăng ký trong `HealthConfig.ready()`)."""

from app.core.registry.module_descriptor import ModuleDescriptor
from app.core.registry.module_group import ModuleGroup

MODULE = ModuleDescriptor(
    code="health",
    name="Health",
    description="Kiểm tra tình trạng hệ thống.",
    version="1.0.0",
    group=ModuleGroup.SYSTEM,
    icon="activity",
    is_core=True,
)
