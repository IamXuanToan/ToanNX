"""Đăng ký module Short Links."""

from app.core.registry.module_descriptor import ModuleDescriptor
from app.modules.short_links.permissions.short_links_permission import ShortLinksPermission

MODULE = ModuleDescriptor(
    code="short_links",
    name="Short Links",
    description="Liên kết ngắn có thể chuyển hướng.",
    version="1.0.0",
    dependencies=("account", "iam", "authentication"),
    permissions=ShortLinksPermission.all(),
)
