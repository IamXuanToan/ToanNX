"""Khai báo module Authentication (đăng ký trong `AuthenticationConfig.ready()`)."""

from app.authentication.permissions.session_permission import SessionPermission
from app.core.registry.module_descriptor import ModuleDescriptor

MODULE = ModuleDescriptor(
    code="authentication",
    name="Authentication",
    description="Đăng nhập, phiên và refresh token.",
    version="1.0.0",
    dependencies=("account", "iam"),
    permissions=SessionPermission.all(),
    cleanup_tasks=("app.authentication.tasks.purge_expired_auth.purge_expired_auth",),
)
