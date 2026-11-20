"""Lệnh `python manage.py seed_roles`: khởi tạo và chuẩn hóa bộ vai trò mẫu theo phân cấp module."""

from typing import Any

from django.core.management.base import BaseCommand

from app.iam.services.role_seed_service import RoleSeedService


class Command(BaseCommand):
    """Khởi tạo các vai trò mẫu chuẩn theo từng phân hệ.

    Bao gồm: Admin, User Manager, Content Manager, Novel Manager, v.v.
    """

    help = "Khởi tạo và gán quyền cho bộ vai trò mẫu chuẩn hóa của toàn hệ thống theo phân cấp module."

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
