"""Quyền quản lý Mẫu Email (EmailTemplate) cho Hệ thống và Cá nhân."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class EmailTemplatePermission(PermissionCatalog):
    """Quyền CRUD mẫu email; thành viên quản lý mẫu cá nhân và đọc mẫu hệ thống đang bật."""

    READ = PermissionDefinition(
        code="system.email_template.read",
        name="Xem mẫu email",
        description="Xem danh sách và chi tiết mẫu email cá nhân hoặc mẫu hệ thống đang hoạt động.",
    )
    CREATE = PermissionDefinition(
        code="system.email_template.create",
        name="Tạo mẫu email",
        description="Tạo mẫu email mới (mẫu cá nhân hoặc nhân bản từ mẫu hệ thống).",
    )
    UPDATE = PermissionDefinition(
        code="system.email_template.update",
        name="Sửa mẫu email",
        description="Cập nhật nội dung Tiptap, trường trộn và trạng thái mẫu email.",
    )
    DELETE = PermissionDefinition(
        code="system.email_template.delete",
        name="Xóa mẫu email",
        description="Xóa mềm mẫu email.",
    )
    MANAGE_ALL = PermissionDefinition(
        code="system.email_template.manage_all",
        name="Quản trị mẫu email toàn hệ thống",
        description="Tạo, sửa, xóa mẫu email dùng chung toàn hệ thống và xem mẫu của mọi người.",
    )

    MEMBER = (READ, CREATE, UPDATE, DELETE)
