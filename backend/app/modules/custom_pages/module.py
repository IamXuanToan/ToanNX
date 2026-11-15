"""Đăng ký module Custom Pages."""

from app.core.registry.module_descriptor import ModuleDescriptor
from app.modules.custom_pages.permissions.custom_pages_permission import CustomPagesPermission

MODULE = ModuleDescriptor(
    code="custom_pages",
    name="Custom Pages",
    description="Trang công khai `/<đường dẫn giữa>/<slug>`, nội dung soạn bằng Tiptap (JSON).",
    version="1.0.0",
    dependencies=("account", "iam", "attachment", "short_links"),
    permissions=CustomPagesPermission.all(),
)
