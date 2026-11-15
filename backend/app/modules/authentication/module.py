"""Khai báo module Authentication (đăng ký trong `AuthenticationConfig.ready()`)."""

from app.core.registry.module_descriptor import ModuleDescriptor
from app.modules.authentication.permissions.authentication_permission import AuthenticationPermission

MODULE = ModuleDescriptor(
    code="authentication",
    name="Authentication",
    description="Đăng nhập, phiên và refresh token.",
    version="1.0.0",
    dependencies=("account", "iam"),
    permissions=AuthenticationPermission.all(),
)
