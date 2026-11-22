"""Danh mục quyền cho tài nguyên Attachment."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class AttachmentPermission(PermissionCatalog):
    """Quyền quản lý tệp attachment."""

    FILE_READ = PermissionDefinition(
        code="system.attachment.read",
        name="Xem file",
        description="Xem thông tin và đường dẫn file đã upload.",
    )
    FILE_CREATE = PermissionDefinition(
        code="system.attachment.create",
        name="Upload file",
        description="Upload file mới (ảnh đại diện, tài liệu) theo giới hạn dung lượng và định dạng.",
    )
    FILE_UPDATE = PermissionDefinition(
        code="system.attachment.update",
        name="Sửa file",
        description="Đổi tên, alt, nhóm logic, chuyển công khai/riêng tư; không sửa nội dung file.",
    )
    FILE_DELETE = PermissionDefinition(
        code="system.attachment.delete",
        name="Xóa file",
        description="Xóa mềm file; nơi đang tham chiếu sẽ không còn hiển thị file.",
    )
    FILE_MANAGE_ALL = PermissionDefinition(
        code="system.attachment.manage_all",
        name="Quản lý file của mọi người",
        description="Mở rộng phạm vi sang file và thư mục của mọi người; vẫn cần quyền thao tác tương ứng.",
    )
    FILE_READ_PRIVATE = PermissionDefinition(
        code="system.attachment.read_private",
        name="Xem mọi tệp riêng tư",
        description="Mở nội dung file riêng tư của người khác (chứng từ...); không mở rộng quyền sửa, xóa.",
    )

    # Quyền của vai trò thành viên: thao tác bản ghi do mình tạo.
    MEMBER = (FILE_READ, FILE_CREATE, FILE_UPDATE, FILE_DELETE)
