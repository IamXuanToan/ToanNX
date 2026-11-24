"""Lệnh `python manage.py seed_pages`: seed dữ liệu mẫu các thể loại trang tùy chỉnh.

Chỉ chạy khi `DEBUG=True` hoặc môi trường phát triển/staging.
Tạo 5 trang đại diện cho 5 thể loại chính với đầy đủ thông tin ở mọi trường:
1. Tiếp thị liên kết (AFFILIATE) - Góc setup công nghệ
2. Liên kết cá nhân (BIO) - Creator Link-in-Bio
3. Hồ sơ năng lực (PORTFOLIO) - Portfolio Kỹ sư phần mềm
4. Ủng hộ / Quyên góp (DONATION) - Mời cafe VietQR
5. Trang bài viết (LEGACY_PAGE) - Giới thiệu hệ thống qua Tiptap Rich Text

Gán chủ sở hữu (owner) cho user `toannx` (`nxtoan2k4@gmail.com`).
"""

from typing import Any

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError, CommandParser

from app.utilities.services.page_seed_service import PageSeedService

DEFAULT_EMAIL = "nxtoan2k4@gmail.com"


class Command(BaseCommand):
    """Seed dữ liệu trang tùy chỉnh đa dạng các thể loại với đầy đủ mọi trường."""

    help = "Seed dữ liệu mẫu các thể loại trang (Affiliate, Bio, Portfolio, Donation, Legacy)."

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """Khởi tạo command và inject PageSeedService."""
        super().__init__(*args, **kwargs)
        self.page_seed_service = PageSeedService()

    def add_arguments(self, parser: CommandParser) -> None:
        """Tham số tuỳ chọn tài khoản nhận trang.

        Args:
            parser: Parser của lệnh.
        """
        parser.add_argument("--email", default=DEFAULT_EMAIL, help="Email người dùng sở hữu trang.")

    def handle(self, *args: Any, **options: Any) -> None:
        """Tạo hoặc cập nhật các trang mẫu với dữ liệu trọn vẹn nhất.

        Args:
            *args: Không dùng.
            **options: `email`.

        Raises:
            CommandError: Chạy khi `DEBUG=False` hoặc không tìm thấy user.
        """
        if not settings.DEBUG:
            raise CommandError("seed_pages chỉ được phép chạy khi DEBUG=True.")

        email = options["email"]
        try:
            results = self.page_seed_service.seed_sample_pages(email)
            self.stdout.write(self.style.SUCCESS("--- ĐÃ TẠO THÀNH CÔNG DỮ LIỆU SEED CÁC THỂ LOẠI TRANG ---"))
            for res in results:
                self.stdout.write(res)
        except ValueError as exc:
            raise CommandError(str(exc)) from exc
