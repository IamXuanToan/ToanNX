"""Lệnh `python manage.py seed_finance`: seed dữ liệu thu nhập tài chính mẫu.

Chỉ chạy khi `DEBUG=True` hoặc môi trường phát triển/staging.
Tạo các nền tảng và khoản thu 12 tháng năm 2026 và năm 2025 cho user.
"""

from typing import Any

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError, CommandParser

from app.finance.services.finance_seed_service import FinanceSeedService

DEFAULT_EMAIL = "nxtoan2k4@gmail.com"


class Command(BaseCommand):
    """Seed dữ liệu tài chính mẫu phong phú cho Dashboard và báo cáo."""

    help = "Seed dữ liệu thu nhập và nền tảng tài chính mẫu (Finance incomes & platforms)."

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """Khởi tạo command và inject FinanceSeedService."""
        super().__init__(*args, **kwargs)
        self.finance_seed_service = FinanceSeedService()

    def add_arguments(self, parser: CommandParser) -> None:
        """Tham số tuỳ chọn tài khoản sở hữu.

        Args:
            parser: Parser của lệnh.
        """
        parser.add_argument(
            "--email", default=DEFAULT_EMAIL, help="Email người dùng sở hữu dữ liệu tài chính."
        )

    def handle(self, *args: Any, **options: Any) -> None:
        """Tạo dữ liệu tài chính mẫu.

        Args:
            *args: Không dùng.
            **options: `email`.

        Raises:
            CommandError: Chạy khi `DEBUG=False` hoặc không tìm thấy user.
        """
        if not settings.DEBUG:
            raise CommandError("seed_finance chỉ được phép chạy khi DEBUG=True.")

        email = options["email"]
        try:
            results = self.finance_seed_service.seed_sample_finance(email)
            self.stdout.write(self.style.SUCCESS("--- ĐÃ TẠO THÀNH CÔNG DỮ LIỆU SEED TÀI CHÍNH ---"))
            for res in results:
                self.stdout.write(res)
        except ValueError as exc:
            raise CommandError(str(exc)) from exc
