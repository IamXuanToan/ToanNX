"""Danh mục quyền cho tài nguyên Thư mục Attachment (AttachmentFolder)."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class AttachmentFolderPermission(PermissionCatalog):
    """Quyền quản lý thư mục attachment."""

    FOLDER_READ = PermissionDefinition(
        code="system.attachment_folder.read",
        name="Xem thư mục",
        description="Xem nhóm file trong phạm vi thư viện được cấp.",
    )
    FOLDER_CREATE = PermissionDefinition(
        code="system.attachment_folder.create",
        name="Tạo thư mục",
        description="Tạo nhóm logic của chính mình; không tạo đường dẫn storage mới.",
    )
    FOLDER_UPDATE = PermissionDefinition(
        code="system.attachment_folder.update",
        name="Sửa thư mục",
        description="Đổi tên hoặc chuyển nhánh thư mục trong phạm vi được cấp, không đổi URL file.",
    )
    FOLDER_DELETE = PermissionDefinition(
        code="system.attachment_folder.delete",
        name="Xóa thư mục",
        description="Xóa mềm cả nhánh, giữ file về chưa phân loại; xóa cả file cần thêm quyền xóa file.",
    )
