"""Khai báo module IAM (đăng ký trong `IamConfig.ready()`)."""

from app.core.registry.module_descriptor import ModuleDescriptor
from app.core.registry.module_group import ModuleGroup
from app.modules.iam.permissions.iam_permission import IamPermission

MODULE = ModuleDescriptor(
    code="iam",
    name="IAM",
    description="Vai trò và phân quyền (RBAC) cho tài khoản.",
    version="1.0.0",
    group=ModuleGroup.SYSTEM,
    icon="shield-check",
    is_core=True,
    dependencies=("account",),
    permissions=IamPermission.all(),
)
