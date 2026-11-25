"""Lệnh `python manage.py seed_demo`: nạp toàn bộ dữ liệu mẫu chuẩn của hệ thống.

Chỉ chạy khi `DEBUG=True` hoặc môi trường phát triển/staging.
Nạp tổng thể:
1. Đồng bộ quyền IAM và Superuser (`sync_iam`)
2. Nền tảng và thu nhập tài chính 12 tháng năm 2026 & năm 2025 (`seed_finance`)
3. Trang Bio / Donate cá nhân (`seed_pages`)
4. 45+ giao dịch quyên góp mẫu trải đều 30 ngày qua (`seed_donations`)
5. Link rút gọn mẫu kèm số lượt truy cập (`seed_short_links`)
"""

from typing import Any

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError, CommandParser

from app.system.utils.frontend_url import get_frontend_origin

DEFAULT_EMAIL = "nxtoan2k4@gmail.com"


class Command(BaseCommand):
    """Seed toàn bộ dữ liệu mẫu chuẩn cho hệ thống ToanNX."""

    help = "Seed toàn bộ dữ liệu mẫu chuẩn (Finance, Donations, Pages, ShortLinks) để kiểm thử thống kê."

    def add_arguments(self, parser: CommandParser) -> None:
        """Tham số tuỳ chọn tài khoản sở hữu.

        Args:
            parser: Parser của lệnh.
        """
        parser.add_argument("--email", default=DEFAULT_EMAIL, help="Email người dùng sở hữu dữ liệu.")

    def handle(self, *args: Any, **options: Any) -> None:
        """Thực thi seed toàn bộ dữ liệu mẫu.

        Args:
            *args: Không dùng.
            **options: `email`.

        Raises:
            CommandError: Chạy khi `DEBUG=False`.
        """
        if not settings.DEBUG:
            raise CommandError("seed_demo chỉ được phép chạy khi DEBUG=True.")

        email = options["email"]
        self.stdout.write(self.style.MIGRATE_HEADING("=================================================="))
        self.stdout.write(self.style.MIGRATE_HEADING("  BẮT ĐẦU NẠP DỮ LIỆU SEED MẪU TOÀN HỆ THỐNG TOANNX  "))
        self.stdout.write(self.style.MIGRATE_HEADING("=================================================="))

        # 1. Đồng bộ quyền & đảm bảo superuser
        self.stdout.write("\n[1/5] Đồng bộ quyền và vai trò IAM...")
        call_command("seed_local", email=email, stdout=self.stdout)

        # 2. Seed nền tảng & thu nhập tài chính
        self.stdout.write("\n[2/5] Nạp nền tảng và thu nhập tài chính (12 tháng năm 2026 & năm 2025)...")
        call_command("seed_finance", email=email, stdout=self.stdout)

        # 3. Seed các trang mẫu
        self.stdout.write("\n[3/5] Nạp các trang tùy chỉnh mẫu (Bio & Donate)...")
        call_command("seed_pages", email=email, stdout=self.stdout)

        # 4. Seed 45+ giao dịch quyên góp SePay
        self.stdout.write("\n[4/5] Nạp 45+ giao dịch quyên góp SePay mẫu trải đều 30 ngày qua...")
        call_command("seed_donations", email=email, stdout=self.stdout)

        # 5. Seed các link rút gọn kèm lượt click
        self.stdout.write("\n[5/5] Nạp link rút gọn mẫu kèm số lượt click thực tế...")
        call_command("seed_short_links", email=email, stdout=self.stdout)

        self.stdout.write(self.style.SUCCESS("\n=================================================="))
        self.stdout.write(self.style.SUCCESS("  HOÀN TẤT NẠP TOÀN BỘ DỮ LIỆU SEED MẪU CHUẨN!   "))
        self.stdout.write(self.style.SUCCESS("=================================================="))
        frontend_origin = get_frontend_origin()
        self.stdout.write("Các trang bạn có thể truy cập để kiểm tra thống kê và biểu đồ ngay:")
        self.stdout.write(f"  • Thống kê quyên góp (Portal): {frontend_origin}/vi/ca-nhan/quyen-gop")
        self.stdout.write(f"  • Tổng quan cá nhân (Portal):  {frontend_origin}/vi/ca-nhan")
        self.stdout.write(f"  • Quản trị tài chính (Admin):  {frontend_origin}/vi/quan-tri/tai-chinh")
        self.stdout.write(f"  • Quản trị tiện ích (Admin):   {frontend_origin}/vi/quan-tri/tien-ich")
        self.stdout.write(f"  • Quản lý link rút gọn:        {frontend_origin}/vi/ca-nhan/link-rut-gon")
