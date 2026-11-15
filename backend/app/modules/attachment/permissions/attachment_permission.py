"""Danh mục quyền của module Attachment."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class AttachmentPermission(PermissionCatalog):
    """Quyền Attachment. Mỗi quyền ghi rõ cho phép làm gì."""

    FOLDER_READ = PermissionDefinition(
        code="attachment.folder.read",
        name="Xem thư mục",
        description="Xem nhóm file trong phạm vi thư viện được cấp.",
    )
    FOLDER_CREATE = PermissionDefinition(
        code="attachment.folder.create",
        name="Tạo thư mục",
        description="Tạo nhóm logic của chính mình; không tạo đường dẫn storage mới.",
    )
    FOLDER_UPDATE = PermissionDefinition(
        code="attachment.folder.update",
        name="Sửa thư mục",
        description="Đổi tên hoặc chuyển nhánh thư mục trong phạm vi được cấp, không đổi URL file.",
    )
    FOLDER_DELETE = PermissionDefinition(
        code="attachment.folder.delete",
        name="Xóa thư mục",
        description="Xóa mềm cả nhánh, giữ file về chưa phân loại; xóa cả file cần thêm quyền xóa file.",
    )
    FILE_UPDATE = PermissionDefinition(
        code="attachment.file.update",
        name="Chuyển thư mục file",
        description="Đổi nhóm logic của file; không sửa nội dung hoặc URL.",
    )

    FILE_MANAGE_ALL = PermissionDefinition(
        code="attachment.file.manage_all",
        name="Quản lý file của mọi người",
        description="Mở rộng phạm vi sang file và thư mục của mọi người; vẫn cần quyền thao tác tương ứng.",
    )

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
