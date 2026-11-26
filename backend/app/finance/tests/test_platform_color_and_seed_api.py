"""Kiểm thử màu sắc nền tảng (HEX + báo cáo) và seed nền tảng Donate mặc định."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.finance.models.platform import Platform
from app.finance.permissions.income_permission import IncomePermission
from app.finance.permissions.platform_permission import PlatformPermission
from app.finance.permissions.report_permission import ReportPermission
from app.finance.tests.helpers.finance_test_helper import currency
from app.system.permissions.currency_permission import CurrencyPermission
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
PLATFORMS_URL = "/api/v1/finance/platforms"
SEED_URL = "/api/v1/finance/platforms/seed-defaults"
INCOMES_URL = "/api/v1/finance/incomes"
SUMMARY_URL = "/api/v1/finance/reports/summary"
MONTHLY_URL = "/api/v1/finance/reports/monthly"


class TestPlatformColorAndSeedApi(BaseApiTestCase):
    """Kiểm thử CRUD màu nền tảng, trả màu ở báo cáo và seed nền tảng Donate."""

    def test_create_update_color_and_report_mapping(self, login: Any) -> None:
        user = UserFactory()
        grant(
            user,
            PlatformPermission.READ,
            PlatformPermission.CREATE,
            PlatformPermission.UPDATE,
            IncomePermission.READ,
            IncomePermission.CREATE,
            ReportPermission.READ,
            CurrencyPermission.READ,
        )
        api = login(user)
        vnd_id = str(currency("VND").pk)

        bad = api.post(
            PLATFORMS_URL,
            {"name": "Patreon", "code": "patreon", "default_currency_id": vnd_id, "color": "red"},
            format="json",
        )
        self.assert_error(bad, 400, "VALIDATION_ERROR")

        created = api.post(
            PLATFORMS_URL,
            {
                "name": "Patreon",
                "code": "patreon",
                "default_currency_id": vnd_id,
                "color": "#ff424d",
            },
            format="json",
        )
        platform_data = self.assert_success(created, 201)
        assert platform_data["color"] == "#FF424D"

        patched = api.patch(
            f"{PLATFORMS_URL}/{platform_data['id']}",
            {"note": "Đã cập nhật ghi chú"},
            format="json",
        )
        assert self.assert_success(patched, 200)["color"] == "#FF424D"

        income_res = api.post(
            INCOMES_URL,
            {
                "currency_id": vnd_id,
                "platform_id": platform_data["id"],
                "received_at": "2026-06-15T10:00:00+07:00",
                "original_amount": "500000",
                "content": "PATREON JUNE",
            },
            format="json",
        )
        self.assert_success(income_res, 201)

        summary = self.assert_success(api.get(SUMMARY_URL, {"year": 2026}), 200)
        assert summary["by_platform"][0]["platform"] == "Patreon"
        assert summary["by_platform"][0]["color"] == "#FF424D"

        monthly = self.assert_success(api.get(MONTHLY_URL, {"year": 2026}), 200)
        assert monthly["by_platform"][0]["platform"] == "Patreon"
        assert monthly["by_platform"][0]["color"] == "#FF424D"

    def test_seed_defaults_includes_donate_with_color_and_zero_tax(self, login: Any) -> None:
        user = UserFactory()
        grant(
            user,
            PlatformPermission.READ,
            PlatformPermission.CREATE,
            IncomePermission.READ,
            IncomePermission.CREATE,
            CurrencyPermission.READ,
        )
        api = login(user)

        res = self.assert_success(api.post(SEED_URL, {}, format="json"), 200)
        assert res["created"] == 5

        donate = Platform.objects.get(owner=user, code="donate")
        assert donate.name == "Donate"
        assert donate.color == "#DB2777"
        assert donate.rules.filter(is_active=True).exists()
        assert donate.tax_rates.filter(tax_withheld=False, rate=0).exists()

        # Tự nhận diện nội dung chuyển khoản Donate không dính NO_RATE
        inc = self.assert_success(
            api.post(
                INCOMES_URL,
                {
                    "currency_id": str(currency("VND").pk),
                    "received_at": "2026-07-01T12:00:00+07:00",
                    "original_amount": "200000",
                    "content": "NGUYEN VAN A DONATE UONG CA PHE",
                },
                format="json",
            ),
            201,
        )
        assert inc["platform_id"] == str(donate.pk)
        assert inc["tax_status"] == "NOT_WITHHELD"
