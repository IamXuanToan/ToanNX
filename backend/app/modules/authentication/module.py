"""Khai báo module Authentication (đăng ký trong `AuthenticationConfig.ready()`)."""

from app.core.registry.module_descriptor import ModuleDescriptor
from app.core.registry.module_group import ModuleGroup

MODULE = ModuleDescriptor(
    code="authentication",
    name="Authentication",
    description="Đăng nhập, phiên và refresh token.",
    version="1.0.0",
    group=ModuleGroup.SYSTEM,
    icon="key-round",
    is_core=True,
    dependencies=("account", "iam"),
)
