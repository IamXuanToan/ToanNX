"""Danh mục quyền cho tài nguyên Nhật ký hệ thống (JournalEntry)."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class JournalEntryPermission(PermissionCatalog):
    """Quyền Journal. Lịch sử của một bản ghi đọc qua `…/{id}/history` theo quyền đọc bản ghi đó."""

    ENTRY_READ = PermissionDefinition(
        code="system.journal_entry.read",
        name="Xem nhật ký hệ thống",
        description="Xem lịch sử thay đổi của mọi bản ghi trong toàn hệ thống, lọc theo module.model.",
    )
    ENTRY_DELETE = PermissionDefinition(
        code="system.journal_entry.delete",
        name="Xóa nhật ký thay đổi",
        description="Xóa hẳn mục nhật ký (từng mục hoặc hàng loạt); lịch sử đã xóa không khôi phục được.",
    )
