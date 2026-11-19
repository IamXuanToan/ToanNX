"""Khai báo module Account (đăng ký trong `AccountConfig.ready()`)."""

from app.core.registry.module_descriptor import ModuleDescriptor
from app.modules.account.permissions.user_permission import UserPermission

MODULE = ModuleDescriptor(
    code="account",
    name="Account",
    description="Tài khoản người dùng: thông tin, mật khẩu, khóa/mở tài khoản.",
    version="1.0.0",
    dependencies=("attachment",),
    permissions=UserPermission.all(),
)
