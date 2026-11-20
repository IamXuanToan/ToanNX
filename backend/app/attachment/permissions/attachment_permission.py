"""Danh mục quyền cho tài nguyên Attachment."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class AttachmentPermission(PermissionCatalog):
    """Quyền quản lý tệp attachment."""

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
    FILE_UPDATE = PermissionDefinition(
        code="attachment.file.update",
        name="Chuyển thư mục file",
        description="Đổi nhóm logic của file; không sửa nội dung hoặc URL.",
    )
    FILE_DELETE = PermissionDefinition(
        code="attachment.file.delete",
        name="Xóa file",
        description="Xóa mềm file; nơi đang tham chiếu sẽ không còn hiển thị file.",
    )
    FILE_MANAGE_ALL = PermissionDefinition(
        code="attachment.file.manage_all",
        name="Quản lý file của mọi người",
        description="Mở rộng phạm vi sang file và thư mục của mọi người; vẫn cần quyền thao tác tương ứng.",
    )
