"""Khai báo module System (đăng ký trong `SystemConfig.ready()`)."""

from app.core.registry.module_descriptor import ModuleDescriptor
from app.core.registry.module_group import ModuleGroup
from app.modules.system.permissions.system_permission import SystemPermission

MODULE = ModuleDescriptor(
    code="system",
    name="System",
    description="Cấu hình module của hệ thống.",
    version="1.0.0",
    group=ModuleGroup.SYSTEM,
    icon="settings",
    is_core=True,
    dependencies=("iam", "attachment"),
    permissions=SystemPermission.all(),
)
