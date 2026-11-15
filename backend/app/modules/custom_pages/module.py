"""Đăng ký module Custom Pages."""

from app.core.registry.module_descriptor import ModuleDescriptor
from app.modules.custom_pages.permissions.custom_pages_permission import CustomPagesPermission

MODULE = ModuleDescriptor(
    code="custom_pages",
    name="Custom Pages",
    description="Trang cá nhân từ block có cấu trúc.",
    version="1.0.0",
    dependencies=("account", "iam", "authentication", "attachment"),
    permissions=CustomPagesPermission.all(),
)
