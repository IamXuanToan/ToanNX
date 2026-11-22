"""Chạy mọi task dọn dữ liệu do các module khai trong `ModuleDescriptor.cleanup_tasks`."""

import logging

from django.utils.module_loading import import_string

from app.core.registry.module_registry import module_registry

logger = logging.getLogger("app.cleanup")


class CleanupService:
    """Một task lỗi không chặn task khác; kết quả ghi log."""

    def run_all(self) -> dict[str, int]:
        """Chạy lần lượt các task.

        Returns:
            `{đường dẫn task: số bản ghi đã xóa}`; task lỗi có giá trị -1.
        """
        results: dict[str, int] = {}
        for module in module_registry.all():
            for path in module.cleanup_tasks:
                try:
                    results[path] = int(import_string(path)())
                except Exception:  # noqa: BLE001 - task lỗi được log, không làm hỏng task khác.
                    logger.exception("Task dọn dữ liệu lỗi: %s", path)
                    results[path] = -1
        return results
