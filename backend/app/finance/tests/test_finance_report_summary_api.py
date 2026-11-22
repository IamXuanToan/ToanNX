"""GET /finance/reports/summary: kịch bản cả năm 2026 phải khớp bảng 14.3 của plan."""

from typing import Any

import pytest

from app.finance.models.income import Income
from app.finance.tests.scenarios.finance_2026 import EXPECTED_2026, build

pytestmark = pytest.mark.django_db
URL = "/api/v1/finance/reports/summary"


@pytest.fixture
def scenario(superuser: Any, login: Any, client: Any) -> dict[str, Any]:
    api = login(superuser)
    return {"api": api, "ids": build(api, client, superuser)}


def test_year_2026_totals(scenario: dict[str, Any]) -> None:
    body = scenario["api"].get(URL, {"year": 2026}).json()["data"]
    totals = body["totals"]
    for key, value in EXPECTED_2026.items():
        assert totals[key] == value, key
    assert int(totals["withheld"]) + int(totals["not_withheld"]) == int(totals["total"])


def test_by_platform_split_by_rate(scenario: dict[str, Any]) -> None:
    rows = scenario["api"].get(URL, {"year": 2026}).json()["data"]["by_platform"]
    facebook = {row["tax_rate"]: row for row in rows if row["platform"] == "Facebook"}
    assert (
        facebook["8.00"]["count"] == 2
        and facebook["8.00"]["total"] == "13800000"
        and facebook["8.00"]["tax"] == "1200000"
    )
    assert (
        facebook["10.00"]["count"] == 4
        and facebook["10.00"]["total"] == "40500000"
        and facebook["10.00"]["tax"] == "4450000"
    )
    upwork = next(row for row in rows if row["platform"] == "Upwork")
    assert upwork["total"] == "38400000" and upwork["tax"] == "4266666"
    freelance = next(row for row in rows if row["platform"] == "Làm tự do")
    assert freelance["count"] == 3 and freelance["total"] == "35325000"


def test_by_month_and_currency(scenario: dict[str, Any]) -> None:
    body = scenario["api"].get(URL, {"year": 2026}).json()["data"]
    months = {row["month"]: row for row in body["by_month"]}
    assert months[12]["count"] == 7 and months[12]["total"] == "86725000" and months[12]["tax"] == "7269298"
    assert months[11]["withheld"] == "4500000" and months[11]["not_withheld"] == "15000000"
    assert months[1]["count"] == 0
    currencies = {row["currency"]: row for row in body["by_currency"]}
    assert currencies["VND"]["count"] == 11 and currencies["VND"]["total"] == "83050000"
    assert currencies["USD"]["count"] == 4 and currencies["USD"]["total"] == "58725000"
    assert currencies["USD"]["original"].startswith("2300")


def test_month_and_previous_year(scenario: dict[str, Any]) -> None:
    july = scenario["api"].get(URL, {"year": 2026, "month": 7}).json()["data"]["totals"]
    assert july["count"] == 1 and july["total"] == "9000000" and july["tax"] == "1000000"
    year_2025 = scenario["api"].get(URL, {"year": 2025}).json()["data"]["totals"]
    assert (
        year_2025["count"] == 1 and year_2025["not_withheld"] == "4600000" and year_2025["needs_review"] == 1
    )


def test_step_results(scenario: dict[str, Any]) -> None:
    """Kết quả từng giao dịch: % chụp theo ngày VN, làm tròn, BANK_ACTUAL, UNKNOWN."""
    ids = scenario["ids"]
    assert ids["S3_affected"] == []

    def get(key: str) -> Income:
        return Income.objects.get(pk=ids[key])

    s4 = get("S4")
    assert s4.tax_rate == 10 and s4.tax_amount == 1000000 and s4.received_date.isoformat() == "2026-07-01"
    assert get("S1").tax_rate == 8 and get("S2").tax_rate == 8
    assert get("S17").tax_amount == 52632 and get("S17").gross_amount == 1052632
    s18 = get("S18")
    assert s18.is_tax_manual and s18.tax_amount == 950000 and s18.gross_amount == 9950000
    s20 = get("S20")
    assert (
        s20.exchange_rate == 25600
        and s20.amount == 25600000
        and s20.tax_amount == 2844444
        and s20.rate_source == "API"
    )
    s21 = get("S21")
    assert s21.exchange_rate == 25650 and s21.rate_date.isoformat() == "2026-12-25" and s21.amount == 12825000
    assert get("S22").amount == 7500000 and get("S22").rate_source == "MANUAL"
    s23 = get("S23")
    assert (
        s23.rate_source == "BANK_ACTUAL"
        and s23.amount == 12800000
        and s23.exchange_rate == 25600
        and s23.tax_amount == 1422222
    )
    s25 = get("S25")
    assert s25.amount_status == "UNKNOWN" and s25.tax_status == "PENDING" and s25.amount is None
    assert get("S8").tax_status == "UNCLASSIFIED"
    assert get("S19").tax_status == "NO_RATE"
    # S6 trùng mã giao dịch FT1004 của S5 → không tạo khoản mới.
    assert ids["S6"] is None and Income.objects.filter(reference_code="FT1004").count() == 1
    assert ids["S10"] is None
    assert Income.objects.filter(sepay_id="1006").count() == 1


def test_resolving_unknown_amount(scenario: dict[str, Any]) -> None:
    """Nhập S25 thành 1.000.000 và để chưa nhận diện: tổng 142.775.000, chưa khấu trừ 39.575.000."""
    api, ids = scenario["api"], scenario["ids"]
    vnd = Income.objects.get(pk=ids["S1"]).currency_id
    response = api.patch(
        f"/api/v1/finance/incomes/{ids['S25']}",
        {"currency_id": str(vnd), "original_amount": "1000000"},
        format="json",
    )
    assert response.status_code == 200, response.content
    totals = api.get(URL, {"year": 2026}).json()["data"]["totals"]
    assert (
        totals["total"] == "142775000"
        and totals["not_withheld"] == "39575000"
        and totals["needs_review"] == 2
    )
