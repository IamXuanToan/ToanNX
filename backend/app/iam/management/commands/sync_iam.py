"""Lệnh `python manage.py sync_iam`: đồng bộ quyền và vai trò hệ thống."""

from typing import Any

from django.core.management.base import BaseCommand

from app.iam.services.iam_sync_service import IamSyncService


class Command(BaseCommand):
    """Đồng bộ quyền khai báo trong module registry vào database."""

    help = "Đồng bộ quyền từ module registry và cấp quyền cho vai trò theo Role.auto_grant."

    def handle(self, *args: Any, **options: Any) -> None:
        """Chạy đồng bộ.

        Args:
            *args: Không dùng.
            **options: Không dùng.
        """
        result = IamSyncService().sync()
        self.stdout.write(
            self.style.SUCCESS(
                f"Đã đồng bộ: {result['created']} quyền mới, {result['deactivated']} quyền bị vô hiệu, "
                f"{result['granted']} quyền được cấp tự động."
            )
        )
