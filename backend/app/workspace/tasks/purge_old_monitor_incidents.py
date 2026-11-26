"""Task dọn sự cố giám sát quá hạn giữ (khai trong `ModuleDescriptor.cleanup_tasks`)."""

from app.workspace.services.workspace_cleanup_service import WorkspaceCleanupService


def purge_old_monitor_incidents() -> int:
    """Lớp vỏ task chỉ gọi `WorkspaceCleanupService` theo quy ước kiến trúc backend."""
    return WorkspaceCleanupService().purge_old_monitor_incidents()
