"""Quyền Két sắt bí mật cá nhân."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class VaultItemPermission(PermissionCatalog):
    """Quyền đọc, lưu, xóa và giải mã bí mật két sắt."""

    READ = PermissionDefinition(
        code="workspace.vault_item.read",
        name="Xem danh sách két sắt",
        description="Xem danh sách bí mật ở dạng che 4 ký tự cuối.",
    )
    CREATE = PermissionDefinition(
        code="workspace.vault_item.create",
        name="Thêm mục két sắt",
        description="Lưu bí mật mới đã mã hóa vào két sắt.",
    )
    UPDATE = PermissionDefinition(
        code="workspace.vault_item.update",
        name="Sửa mục két sắt",
        description="Cập nhật thông tin hoặc thay bí mật.",
    )
    DELETE = PermissionDefinition(
        code="workspace.vault_item.delete",
        name="Xóa mục két sắt",
        description="Xóa mềm mục bí mật.",
    )
    REVEAL = PermissionDefinition(
        code="workspace.vault_item.reveal",
        name="Giải mã bí mật két sắt",
        description="Mở xem giá trị giải mã nguyên bản (có ghi nhận lịch sử).",
    )
    MANAGE_ALL = PermissionDefinition(
        code="workspace.vault_item.manage_all",
        name="Quản lý mọi mục két sắt",
        description="Mở phạm vi thao tác sang két sắt của mọi người dùng.",
    )

    MEMBER = (READ, CREATE, UPDATE, DELETE, REVEAL)
