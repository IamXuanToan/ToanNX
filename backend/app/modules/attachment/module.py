"""Khai báo module Attachment (đăng ký trong `AttachmentConfig.ready()`)."""

from app.core.registry.module_descriptor import ModuleDescriptor
from app.core.registry.module_group import ModuleGroup
from app.modules.attachment.permissions.attachment_permission import AttachmentPermission

MODULE = ModuleDescriptor(
    code="attachment",
    name="Attachment",
    description="Lưu trữ file dùng chung (ảnh đại diện, tài liệu...).",
    version="1.0.0",
    group=ModuleGroup.SYSTEM,
    icon="paperclip",
    is_core=True,
    permissions=AttachmentPermission.all(),
)
