"""Lịch sử khấu trừ: sửa mốc trả giao dịch bị ảnh hưởng; chỉ tính lại khi xác nhận (plan 14.5)."""

from typing import Any

import pytest

from app.finance.models.income import Income
from app.finance.models.platform_tax_rate import PlatformTaxRate
from app.finance.tests.scenarios.finance_2026 import build

pytestmark = pytest.mark.django_db
SUMMARY = "/api/v1/finance/reports/summary"


def test_change_effective_date_then_recalculate(superuser: Any, login: Any, client: Any) -> None:
    api = login(superuser)
    ids = build(api, client, superuser)
    facebook = ids["facebook"]
    entry = PlatformTaxRate.objects.get(platform=facebook, rate=10)
    response = api.patch(
        f"/api/v1/finance/platforms/{facebook.pk}/tax-rates/{entry.pk}",
        {"effective_from": "2026-08-01"},
        format="json",
    )
    assert response.status_code == 200, response.content
    assert response.json()["data"]["affected_income_ids"] == [str(ids["S4"])]
    assert Income.objects.get(pk=ids["S4"]).tax_rate == 10  # chưa xác nhận thì giữ nguyên
    response = api.post("/api/v1/finance/incomes/recalculate-tax", {"ids": [str(ids["S4"])]}, format="json")
    assert response.json()["data"]["changed"] == 1
    s4 = Income.objects.get(pk=ids["S4"])
    assert s4.tax_rate == 8 and s4.tax_amount == 782609 and s4.gross_amount == 9782609
    assert api.get(SUMMARY, {"year": 2026}).json()["data"]["totals"]["tax"] == "10251907"


def test_invalid_rate_and_duplicate_date(superuser: Any, login: Any, client: Any) -> None:
    api = login(superuser)
    ids = build(api, client, superuser)
    url = f"/api/v1/finance/platforms/{ids['facebook'].pk}/tax-rates"
    bad = api.post(url, {"effective_from": "2026-09-01", "tax_withheld": True, "rate": "0"}, format="json")
    assert bad.json()["error"]["code"] == "FINANCE_TAX_RATE_INVALID"
    duplicate = api.post(
        url, {"effective_from": "2026-07-01", "tax_withheld": True, "rate": "9"}, format="json"
    )
    assert duplicate.json()["error"]["code"] == "FINANCE_TAX_RATE_DUPLICATE_DATE"
