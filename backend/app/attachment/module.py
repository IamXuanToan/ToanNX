"""Khai báo module Attachment (đăng ký trong `AttachmentConfig.ready()`)."""

from app.attachment.permissions.attachment_folder_permission import AttachmentFolderPermission
from app.attachment.permissions.attachment_permission import AttachmentPermission
from app.core.registry.module_descriptor import ModuleDescriptor

MODULE = ModuleDescriptor(
    code="attachment",
    name="Attachment",
    description="Lưu trữ file dùng chung (ảnh đại diện, tài liệu...).",
    version="1.0.0",
    permissions=(*AttachmentPermission.all(), *AttachmentFolderPermission.all()),
    cleanup_tasks=("app.attachment.tasks.purge_deleted_files.purge_deleted_files",),
)
