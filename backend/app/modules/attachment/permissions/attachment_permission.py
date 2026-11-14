"""Danh mục quyền của module Attachment."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class AttachmentPermission(PermissionCatalog):
    """Quyền Attachment. Mỗi quyền ghi rõ cho phép làm gì."""

    FILE_READ = PermissionDefinition(
        code="attachment.file.read",
        name="Xem file",
        description="Xem thông tin và đường dẫn file đã upload.",
    )
    FILE_CREATE = PermissionDefinition(
        code="attachment.file.create",
        name="Upload file",
        description="Upload file mới (ảnh đại diện, tài liệu) theo giới hạn dung lượng và định dạng.",
    )
    FILE_DELETE = PermissionDefinition(
        code="attachment.file.delete",
        name="Xóa file",
        description="Xóa mềm file; nơi đang tham chiếu sẽ không còn hiển thị file.",
    )
