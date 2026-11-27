"""Task đồng bộ lại cache cron & QStash Workspace mỗi ngày (khai trong `ModuleDescriptor.cleanup_tasks`)."""

from app.workspace.services.workspace_cron_service import WorkspaceCronService


def refresh_cron_schedules() -> int:
    """Lớp vỏ task chỉ gọi `WorkspaceCronService` để re-warm Redis & QStash mỗi ngày khi dọn dẹp."""
    return WorkspaceCronService().refresh_cron_schedules()
