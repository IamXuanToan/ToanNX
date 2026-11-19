"""Đăng ký module Custom Pages."""

from app.core.registry.module_descriptor import ModuleDescriptor
from app.modules.custom_pages.permissions.page_path_permission import PagePathPermission
from app.modules.custom_pages.permissions.page_permission import PagePermission

MODULE = ModuleDescriptor(
    code="custom_pages",
    name="Custom Pages",
    description="Trang công khai `/<đường dẫn giữa>/<slug>`, nội dung soạn bằng Tiptap (JSON).",
    version="1.0.0",
    dependencies=("account", "iam", "attachment", "short_links"),
    permissions=(*PagePermission.all(), *PagePathPermission.all()),
)
