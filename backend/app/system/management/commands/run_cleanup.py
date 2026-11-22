"""`uv run python manage.py run_cleanup`: chạy mọi task dọn dữ liệu của các module."""

from typing import Any

from django.core.management.base import BaseCommand

from app.system.services.cleanup_service import CleanupService


class Command(BaseCommand):
    """Dọn dữ liệu hết hạn (rate limit, phiên, journal…)."""

    help = "Chạy mọi task dọn dữ liệu khai trong ModuleDescriptor.cleanup_tasks."

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(*args, **kwargs)
        self.cleanup_service = CleanupService()

    def handle(self, *args: Any, **options: Any) -> None:
        """Chạy và in kết quả."""
        for path, count in self.cleanup_service.run_all().items():
            self.stdout.write(f"{path}: {count}")
