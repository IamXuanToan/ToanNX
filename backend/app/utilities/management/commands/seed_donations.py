"""Lệnh `python manage.py seed_donations`: seed dữ liệu mẫu các giao dịch quyên góp SePay.

Chỉ chạy khi `DEBUG=True` hoặc môi trường phát triển/staging.
Tạo các giao dịch quyên góp đa dạng mọi bậc (Kim Cương, Vàng, Bạc, Đồng),
các món quà (mì tôm, ly cafe, bữa sáng, sách, nồi lẩu, quà đặc biệt),
các mốc thời gian (hôm nay, 7 ngày qua, 30 ngày qua, quá khứ),
và các trường hợp kiểm duyệt vi phạm từ ngữ, bình luận ẩn.

Gán cho tài khoản chỉ định (mặc định `nxtoan2k4@gmail.com`).
"""

from typing import Any

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError, CommandParser

from app.utilities.services.donation_seed_service import DonationSeedService

DEFAULT_EMAIL = "nxtoan2k4@gmail.com"


class Command(BaseCommand):
    """Seed dữ liệu giao dịch quyên góp mẫu phong phú cho trang Donate."""

    help = "Seed dữ liệu mẫu các giao dịch quyên góp SePay (Donation transactions)."

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """Khởi tạo command và inject DonationSeedService."""
        super().__init__(*args, **kwargs)
        self.donation_seed_service = DonationSeedService()

    def add_arguments(self, parser: CommandParser) -> None:
        """Tham số tuỳ chọn tài khoản nhận quyên góp.

        Args:
            parser: Parser của lệnh.
        """
        parser.add_argument("--email", default=DEFAULT_EMAIL, help="Email người dùng sở hữu trang Donate.")

    def handle(self, *args: Any, **options: Any) -> None:
        """Tạo dữ liệu giao dịch mẫu.

        Args:
            *args: Không dùng.
            **options: `email`.

        Raises:
            CommandError: Chạy khi `DEBUG=False` hoặc không tìm thấy user.
        """
        if not settings.DEBUG:
            raise CommandError("seed_donations chỉ được phép chạy khi DEBUG=True.")

        email = options["email"]
        try:
            results = self.donation_seed_service.seed_sample_donations(email)
            self.stdout.write(self.style.SUCCESS("--- ĐÃ TẠO THÀNH CÔNG DỮ LIỆU SEED QUYÊN GÓP SEPAY ---"))
            for res in results:
                self.stdout.write(res)
        except ValueError as exc:
            raise CommandError(str(exc)) from exc
