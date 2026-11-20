"""Lệnh `python manage.py seed_roles`: tạo/chuẩn hóa `ADMIN` và vai trò quản lý/chỉ xem của từng module."""

from typing import Any

from django.core.management.base import BaseCommand

from app.system.services.role_seed_service import RoleSeedService


class Command(BaseCommand):
    """Tạo vai trò mẫu: `ADMIN` và `<MÃ_MODULE>_MANAGER`/`<MÃ_MODULE>_VIEWER` cho mỗi module đã cài."""

    help = "Tạo/chuẩn hóa ADMIN và vai trò quản lý/chỉ xem của từng module, gán quyền tương ứng."

    def handle(self, *args: Any, **options: Any) -> None:
        """Chạy seed vai trò."""
        result = RoleSeedService().seed()
        self.stdout.write(
            self.style.SUCCESS(
                f"Đã chuẩn hóa bộ vai trò: {result['roles_created']} vai trò tạo mới, "
                f"{result['roles_updated']} vai trò cập nhật, "
                f"{result['permissions_granted']} quyền được gán."
            )
        )
