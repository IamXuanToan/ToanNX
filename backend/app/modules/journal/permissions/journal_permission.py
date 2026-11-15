"""Danh mục quyền của module Journal."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class JournalPermission(PermissionCatalog):
    """Quyền Journal. Lịch sử của một bản ghi đọc qua `…/{id}/history` theo quyền đọc bản ghi đó."""

    ENTRY_READ = PermissionDefinition(
        code="journal.entry.read",
        name="Xem nhật ký hệ thống",
        description="Xem lịch sử thay đổi của mọi bản ghi trong toàn hệ thống, lọc theo module.model.",
    )
