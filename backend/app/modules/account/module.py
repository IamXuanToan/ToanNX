"""Khai báo module Account (đăng ký trong `AccountConfig.ready()`)."""

from app.core.registry.module_descriptor import ModuleDescriptor
from app.core.registry.module_group import ModuleGroup
from app.modules.account.permissions.account_permission import AccountPermission

MODULE = ModuleDescriptor(
    code="account",
    name="Account",
    description="Tài khoản người dùng: thông tin, mật khẩu, khóa/mở tài khoản.",
    version="1.0.0",
    group=ModuleGroup.SYSTEM,
    icon="users",
    is_core=True,
    dependencies=("attachment",),
    permissions=AccountPermission.all(),
)
