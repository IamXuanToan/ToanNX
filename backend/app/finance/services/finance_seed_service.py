"""Service tạo dữ liệu thu nhập tài chính mẫu (seed data) phục vụ kiểm thử và thống kê.

Chỉ chạy khi DEBUG=True trên môi trường local/staging.
Tạo các nền tảng đa dạng:
- YouTube Partner Program
- Shopee Affiliate
- TikTok Shop / Creator
- Freelance Software Development
- GitHub Sponsors & Brand Sponsorship
- Ủng hộ & Quyên góp SePay

Tạo thu nhập trải dài 12 tháng năm 2026 và năm 2025 để kiểm thử biểu đồ so sánh năm.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Any
from zoneinfo import ZoneInfo

from app.core.constants.defaults import DEFAULT_CURRENCY_CODE, DEFAULT_TIMEZONE
from app.finance.models.classification_rule import ClassificationRule
from app.finance.models.income import Income
from app.finance.models.platform import Platform
from app.finance.models.platform_tax_rate import PlatformTaxRate
from app.system.models.currency import Currency
from app.system.repositories.user_repository import UserRepository
from app.system.utils.frontend_url import get_frontend_origin

VN_TZ = ZoneInfo(DEFAULT_TIMEZONE)


class FinanceSeedService:
    """Tạo dữ liệu tài chính mẫu phong phú cho Dashboard và báo cáo tài chính."""

    def __init__(self, user_repository: UserRepository | None = None) -> None:
        """Khởi tạo service."""
        self.user_repository = user_repository or UserRepository()

    def seed_sample_finance(self, email: str) -> list[str]:
        """Tạo dữ liệu nền tảng và thu nhập mẫu cho người dùng.

        Args:
            email: Email người dùng sở hữu.

        Returns:
            Danh sách thông báo kết quả.
        """
        user = self.user_repository.find_by_email(email.strip().lower())
        if not user:
            raise ValueError(f"Không tìm thấy người dùng có email: {email}.")

        currency = Currency.objects.filter(code=DEFAULT_CURRENCY_CODE).first()
        if not currency:
            raise ValueError(f"Không tìm thấy tiền tệ {DEFAULT_CURRENCY_CODE} trong hệ thống.")

        # 1. Tạo các nền tảng mẫu kèm mốc thuế và quy tắc nhận diện
        platforms_def: list[dict[str, Any]] = [
            {
                "code": "youtube",
                "name": "YouTube Partner Program",
                "tax_withheld": False,
                "tax_rate": Decimal("0.00"),
                "pattern": r"YOUTUBE|ADSENSE",
            },
            {
                "code": "shopee",
                "name": "Shopee Affiliate",
                "tax_withheld": False,
                "tax_rate": Decimal("0.00"),
                "pattern": r"SHOPEE",
            },
            {
                "code": "tiktok",
                "name": "TikTok Shop / Creator",
                "tax_withheld": False,
                "tax_rate": Decimal("0.00"),
                "pattern": r"TIKTOK",
            },
            {
                "code": "freelance",
                "name": "Freelance Software Development",
                "tax_withheld": True,
                "tax_rate": Decimal("10.00"),
                "pattern": r"FREELANCE|HOP DONG|THANH TOAN DU AN",
            },
            {
                "code": "sponsorship",
                "name": "GitHub Sponsors & Brand Sponsorship",
                "tax_withheld": False,
                "tax_rate": Decimal("0.00"),
                "pattern": r"SPONSOR|GITHUB",
            },
            {
                "code": "sepay_donation",
                "name": "Ủng hộ & Quyên góp SePay",
                "tax_withheld": False,
                "tax_rate": Decimal("0.00"),
                "pattern": r"UNG HO|QUYEN GOP|DONATE",
            },
        ]

        platform_map: dict[str, Platform] = {}
        tax_rate_map: dict[str, PlatformTaxRate] = {}
        for index, p_def in enumerate(platforms_def):
            plat, _ = Platform.objects.get_or_create(
                owner=user,
                code=p_def["code"],
                defaults={
                    "name": p_def["name"],
                    "default_currency": currency,
                },
            )
            platform_map[p_def["code"]] = plat
            tax_rate_entry, _ = PlatformTaxRate.objects.get_or_create(
                platform=plat,
                effective_from=date(2025, 1, 1),
                defaults={
                    "tax_withheld": p_def["tax_withheld"],
                    "rate": p_def["tax_rate"],
                    "note": "Mốc thuế mặc định khi seed dữ liệu mẫu.",
                },
            )
            tax_rate_map[p_def["code"]] = tax_rate_entry
            ClassificationRule.objects.get_or_create(
                owner=user,
                platform=plat,
                name=f"Nhận diện {p_def['name']}",
                defaults={
                    "pattern": p_def["pattern"],
                    "priority": 100 - index * 10,
                    "is_active": True,
                },
            )

        # 2. Tạo thu nhập mẫu 12 tháng năm 2026
        # Số tiền phong phú mô phỏng thu nhập thực tế của một lập trình viên/content creator
        incomes_2026: list[dict[str, Any]] = [
            # Tháng 1/2026
            {
                "date": date(2026, 1, 15),
                "platform": "freelance",
                "amount": 25000000,
                "content": "Thanh toán dự án xây dựng hệ thống quản trị Monorepo",
                "tax_withheld": True,
                "tax_rate": Decimal("10.00"),
            },
            {
                "date": date(2026, 1, 22),
                "platform": "shopee",
                "amount": 3450000,
                "content": "Hoa hồng tiếp thị liên kết Shopee tháng 12/2025",
                "tax_withheld": False,
                "tax_rate": Decimal("0.00"),
            },
            {
                "date": date(2026, 1, 28),
                "platform": "youtube",
                "amount": 4820000,
                "content": "Doanh thu quảng cáo Google AdSense YouTube",
                "tax_withheld": False,
                "tax_rate": Decimal("0.00"),
            },
            # Tháng 2/2026 (Tết)
            {
                "date": date(2026, 2, 8),
                "platform": "freelance",
                "amount": 32000000,
                "content": "Tất toán hợp đồng nâng cấp Next.js 16 và Django 6",
                "tax_withheld": True,
                "tax_rate": Decimal("10.00"),
            },
            {
                "date": date(2026, 2, 20),
                "platform": "sponsorship",
                "amount": 5000000,
                "content": "Tài trợ doanh nghiệp duy trì thư viện mã nguồn mở",
                "tax_withheld": False,
                "tax_rate": Decimal("0.00"),
            },
            {
                "date": date(2026, 2, 25),
                "platform": "tiktok",
                "amount": 2800000,
                "content": "Thu nhập sáng tạo nội dung video TikTok Tech",
                "tax_withheld": False,
                "tax_rate": Decimal("0.00"),
            },
            # Tháng 3/2026
            {
                "date": date(2026, 3, 12),
                "platform": "freelance",
                "amount": 18500000,
                "content": "Tư vấn kiến trúc hệ thống phân tán",
                "tax_withheld": True,
                "tax_rate": Decimal("10.00"),
            },
            {
                "date": date(2026, 3, 20),
                "platform": "youtube",
                "amount": 6200000,
                "content": "Doanh thu Google AdSense YouTube tháng 2",
                "tax_withheld": False,
                "tax_rate": Decimal("0.00"),
            },
            {
                "date": date(2026, 3, 26),
                "platform": "shopee",
                "amount": 4150000,
                "content": "Hoa hồng tiếp thị liên kết đồ công nghệ Shopee",
                "tax_withheld": False,
                "tax_rate": Decimal("0.00"),
            },
            # Tháng 4/2026
            {
                "date": date(2026, 4, 15),
                "platform": "freelance",
                "amount": 22000000,
                "content": "Triển khai hệ thống xác thực tập trung SSO và RBAC",
                "tax_withheld": True,
                "tax_rate": Decimal("10.00"),
            },
            {
                "date": date(2026, 4, 25),
                "platform": "youtube",
                "amount": 5400000,
                "content": "Doanh thu quảng cáo YouTube tháng 3",
                "tax_withheld": False,
                "tax_rate": Decimal("0.00"),
            },
            # Tháng 5/2026
            {
                "date": date(2026, 5, 10),
                "platform": "sponsorship",
                "amount": 7500000,
                "content": "Gói tài trợ Premium GitHub Sponsors quý 2",
                "tax_withheld": False,
                "tax_rate": Decimal("0.00"),
            },
            {
                "date": date(2026, 5, 18),
                "platform": "freelance",
                "amount": 28000000,
                "content": "Phát triển ứng dụng Web PWA đa nền tảng",
                "tax_withheld": True,
                "tax_rate": Decimal("10.00"),
            },
            {
                "date": date(2026, 5, 27),
                "platform": "shopee",
                "amount": 5100000,
                "content": "Hoa hồng chiến dịch Shopee 5.5",
                "tax_withheld": False,
                "tax_rate": Decimal("0.00"),
            },
            # Tháng 6/2026
            {
                "date": date(2026, 6, 15),
                "platform": "freelance",
                "amount": 35000000,
                "content": "Tối ưu hiệu năng Core Web Vitals và Redis caching",
                "tax_withheld": True,
                "tax_rate": Decimal("10.00"),
            },
            {
                "date": date(2026, 6, 24),
                "platform": "youtube",
                "amount": 7800000,
                "content": "Doanh thu quảng cáo video chuỗi Clean Architecture",
                "tax_withheld": False,
                "tax_rate": Decimal("0.00"),
            },
            # Tháng 7/2026
            {
                "date": date(2026, 7, 12),
                "platform": "freelance",
                "amount": 24000000,
                "content": "Xây dựng cổng thanh toán VietQR và Webhook SePay",
                "tax_withheld": True,
                "tax_rate": Decimal("10.00"),
            },
            {
                "date": date(2026, 7, 26),
                "platform": "tiktok",
                "amount": 3900000,
                "content": "Doanh thu TikTok Creator Rewards",
                "tax_withheld": False,
                "tax_rate": Decimal("0.00"),
            },
            # Tháng 8/2026
            {
                "date": date(2026, 8, 14),
                "platform": "freelance",
                "amount": 30000000,
                "content": "Bảo trì và mở rộng hệ thống Microservices",
                "tax_withheld": True,
                "tax_rate": Decimal("10.00"),
            },
            {
                "date": date(2026, 8, 22),
                "platform": "sponsorship",
                "amount": 10000000,
                "content": "Tài trợ độc quyền từ nhà cung cấp Cloud Hosting",
                "tax_withheld": False,
                "tax_rate": Decimal("0.00"),
            },
            {
                "date": date(2026, 8, 28),
                "platform": "youtube",
                "amount": 8500000,
                "content": "Doanh thu quảng cáo YouTube tháng 7",
                "tax_withheld": False,
                "tax_rate": Decimal("0.00"),
            },
            # Tháng 9/2026
            {
                "date": date(2026, 9, 10),
                "platform": "freelance",
                "amount": 26000000,
                "content": "Triển khai hạ tầng Cloudflare Workers và R2 Storage",
                "tax_withheld": True,
                "tax_rate": Decimal("10.00"),
            },
            {
                "date": date(2026, 9, 25),
                "platform": "shopee",
                "amount": 6200000,
                "content": "Hoa hồng chiến dịch siêu sale 9.9",
                "tax_withheld": False,
                "tax_rate": Decimal("0.00"),
            },
            # Tháng 10/2026
            {
                "date": date(2026, 10, 15),
                "platform": "freelance",
                "amount": 31000000,
                "content": "Thiết kế Dashboard quản trị và báo cáo phân tích",
                "tax_withheld": True,
                "tax_rate": Decimal("10.00"),
            },
            {
                "date": date(2026, 10, 24),
                "platform": "youtube",
                "amount": 9100000,
                "content": "Doanh thu Google AdSense YouTube tháng 9",
                "tax_withheld": False,
                "tax_rate": Decimal("0.00"),
            },
            # Tháng 11/2026 (Tháng hiện tại)
            {
                "date": date(2026, 11, 12),
                "platform": "freelance",
                "amount": 38000000,
                "content": "Hợp đồng tư vấn AI Agent System và Playwright Automation",
                "tax_withheld": True,
                "tax_rate": Decimal("10.00"),
            },
            {
                "date": date(2026, 11, 18),
                "platform": "sponsorship",
                "amount": 12000000,
                "content": "Tài trợ nghiên cứu Deep Learning và Agentic Workflow",
                "tax_withheld": False,
                "tax_rate": Decimal("0.00"),
            },
            {
                "date": date(2026, 11, 23),
                "platform": "shopee",
                "amount": 7500000,
                "content": "Hoa hồng chiến dịch Shopee 11.11",
                "tax_withheld": False,
                "tax_rate": Decimal("0.00"),
            },
            # Tháng 12/2026 (Dự kiến / Cuối năm)
            {
                "date": date(2026, 12, 10),
                "platform": "freelance",
                "amount": 42000000,
                "content": "Nghiệm thu gói phần mềm chuyển đổi số cuối năm",
                "tax_withheld": True,
                "tax_rate": Decimal("10.00"),
            },
            {
                "date": date(2026, 12, 22),
                "platform": "youtube",
                "amount": 11500000,
                "content": "Doanh thu quảng cáo YouTube tổng kết năm",
                "tax_withheld": False,
                "tax_rate": Decimal("0.00"),
            },
        ]

        # 3. Tạo thu nhập mẫu năm 2025 (để biểu đồ so sánh 2 năm hiển thị trọn vẹn)
        incomes_2025: list[dict[str, Any]] = [
            {"month": m, "amount": 12000000 + (m * 1100000), "platform": "freelance"} for m in range(1, 13)
        ]

        created_incomes = 0

        # Nạp năm 2026
        for item in incomes_2026:
            r_date: date = item["date"]
            r_datetime = datetime(r_date.year, r_date.month, r_date.day, 10, 0, 0, tzinfo=VN_TZ)
            platform = platform_map.get(item["platform"])
            amount = Decimal(item["amount"])
            tax_withheld = item["tax_withheld"]
            tax_rate = item["tax_rate"]

            if tax_withheld:
                tax_amount = (amount * tax_rate / Decimal("100")).quantize(Decimal("1"))
                gross_amount = amount + tax_amount
                tax_status = Income.TaxStatus.WITHHELD
            else:
                tax_amount = Decimal("0")
                gross_amount = amount
                tax_status = Income.TaxStatus.NOT_WITHHELD

            _, created = Income.objects.update_or_create(
                owner=user,
                content=item["content"],
                received_date=r_date,
                defaults={
                    "source": Income.Source.MANUAL,
                    "received_at": r_datetime,
                    "platform": platform,
                    "currency": currency,
                    "original_amount": amount,
                    "exchange_rate": Decimal("1"),
                    "amount": amount,
                    "tax_withheld": tax_withheld,
                    "tax_rate": tax_rate,
                    "tax_amount": tax_amount,
                    "gross_amount": gross_amount,
                    "tax_status": tax_status,
                    "tax_rate_entry": tax_rate_map.get(item["platform"]),
                },
            )
            if created:
                created_incomes += 1

        # Nạp năm 2025
        for item in incomes_2025:
            m = item["month"]
            r_date = date(2025, m, 15)
            r_datetime = datetime(2025, m, 15, 14, 0, 0, tzinfo=VN_TZ)
            amount = Decimal(item["amount"])
            tax_amount = (amount * Decimal("10.00") / Decimal("100")).quantize(Decimal("1"))
            gross_amount = amount + tax_amount

            _, created = Income.objects.update_or_create(
                owner=user,
                content=f"Thu nhập hợp đồng Freelance tháng {m}/2025",
                received_date=r_date,
                defaults={
                    "source": Income.Source.MANUAL,
                    "received_at": r_datetime,
                    "platform": platform_map.get("freelance"),
                    "currency": currency,
                    "original_amount": amount,
                    "exchange_rate": Decimal("1"),
                    "amount": amount,
                    "tax_withheld": True,
                    "tax_rate": Decimal("10.00"),
                    "tax_amount": tax_amount,
                    "gross_amount": gross_amount,
                    "tax_status": Income.TaxStatus.WITHHELD,
                    "tax_rate_entry": tax_rate_map.get("freelance"),
                },
            )
            if created:
                created_incomes += 1

        total_incomes = Income.objects.filter(owner=user).count()

        frontend_origin = get_frontend_origin()
        return [
            f"✓ Đã tạo/đồng bộ {len(platforms_def)} nền tảng tài chính mẫu.",
            "✓ Đã nạp thành công các khoản thu nhập mẫu 12 tháng năm 2026 và năm 2025.",
            f"  - Tạo mới: {created_incomes} khoản thu | Tổng hiện tại của user: {total_incomes}",
            f"  - Dashboard Tài chính: {frontend_origin}/vi/quan-tri/tai-chinh",
        ]
