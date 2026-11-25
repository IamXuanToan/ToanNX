"""Lệnh `python manage.py seed_short_links`: seed link rút gọn mẫu.

Chỉ chạy khi `DEBUG=True` hoặc môi trường phát triển/staging.
Tạo danh sách short link mẫu với số lượt click phục vụ biểu đồ Dashboard.
"""

from typing import Any

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError, CommandParser

from app.utilities.services.short_link_seed_service import ShortLinkSeedService

DEFAULT_EMAIL = "nxtoan2k4@gmail.com"


class Command(BaseCommand):
    """Seed dữ liệu link rút gọn mẫu phong phú cho Dashboard."""

    help = "Seed dữ liệu link rút gọn mẫu kèm lượt click (ShortLink samples)."

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """Khởi tạo command và inject ShortLinkSeedService."""
        super().__init__(*args, **kwargs)
        self.short_link_seed_service = ShortLinkSeedService()

    def add_arguments(self, parser: CommandParser) -> None:
        """Tham số tuỳ chọn tài khoản sở hữu.

        Args:
            parser: Parser của lệnh.
        """
        parser.add_argument("--email", default=DEFAULT_EMAIL, help="Email người dùng sở hữu link rút gọn.")

    def handle(self, *args: Any, **options: Any) -> None:
        """Tạo dữ liệu link rút gọn mẫu.

        Args:
            *args: Không dùng.
            **options: `email`.

        Raises:
            CommandError: Chạy khi `DEBUG=False` hoặc không tìm thấy user.
        """
        if not settings.DEBUG:
            raise CommandError("seed_short_links chỉ được phép chạy khi DEBUG=True.")

        email = options["email"]
        try:
            results = self.short_link_seed_service.seed_sample_links(email)
            self.stdout.write(self.style.SUCCESS("--- ĐÃ TẠO THÀNH CÔNG DỮ LIỆU SEED LINK RÚT GỌN ---"))
            for res in results:
                self.stdout.write(res)
        except ValueError as exc:
            raise CommandError(str(exc)) from exc
