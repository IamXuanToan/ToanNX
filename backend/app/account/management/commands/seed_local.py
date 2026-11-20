"""Lệnh `python manage.py seed_local`: dữ liệu local (đồng bộ quyền + superuser của chủ dự án).

Chỉ chạy khi `DEBUG=True`. Chạy lại nhiều lần vẫn cho cùng kết quả (đặt lại mật khẩu, cờ superuser).
"""

from typing import Any

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError, CommandParser

from app.account.services.account_seed_service import AccountSeedService

DEFAULT_EMAIL = "nxtoan2k4@gmail.com"
DEFAULT_USERNAME = "toannx"
DEFAULT_PASSWORD = "zxcvzxcv"  # noqa: S105 - mật khẩu local, lệnh bị chặn khi DEBUG=False.


class Command(BaseCommand):
    """Seed dữ liệu local."""

    help = "Đồng bộ quyền/vai trò hệ thống và tạo (hoặc cập nhật) superuser local."

    def add_arguments(self, parser: CommandParser) -> None:
        """Tham số ghi đè tài khoản mặc định.

        Args:
            parser: Parser của lệnh.
        """
        parser.add_argument("--email", default=DEFAULT_EMAIL, help="Email superuser.")
        parser.add_argument("--username", default=DEFAULT_USERNAME, help="Tên người dùng superuser.")
        parser.add_argument("--password", default=DEFAULT_PASSWORD, help="Mật khẩu superuser.")

    def handle(self, *args: Any, **options: Any) -> None:
        """Đồng bộ quyền rồi bảo đảm có superuser.

        Args:
            *args: Không dùng.
            **options: `email`, `username`, `password`.

        Raises:
            CommandError: Chạy khi `DEBUG=False`.
        """
        if not settings.DEBUG:
            raise CommandError("seed_local chỉ chạy ở local (DEBUG=True).")
        # Gọi qua tên lệnh để module Account không import IAM.
        call_command("sync_iam", stdout=self.stdout)
        user, created = AccountSeedService().ensure_superuser(
            email=options["email"], username=options["username"], password=options["password"]
        )
        action = "Đã tạo" if created else "Đã cập nhật"
        self.stdout.write(self.style.SUCCESS(f"{action} superuser {user.email} (username: {user.username})."))
