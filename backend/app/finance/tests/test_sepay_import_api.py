"""Lấy thủ công (plan 14.6 P1–P4): xem trước NEW/EXISTS/CHANGED/INVALID, chỉ nhập id đã chọn."""

from collections.abc import Iterator
from datetime import date
from typing import Any

import pytest

from app.finance.models.income import Income
from app.finance.tests.helpers.finance_test_helper import make_connection, make_platform, payload, signed_post

pytestmark = pytest.mark.django_db
ROWS = [
    {
        "id": "1001",
        "transaction_date": "2026-08-10 09:00:00",
        "amount_in": "9500000",
        "amount_out": "0",
        "transaction_content": "GOOGLE ASIA YOUTUBE",
        "reference_number": "FT1001",
    },
    {
        "id": "1004",
        "transaction_date": "2026-08-11 09:00:00",
        "amount_in": "9600000",
        "amount_out": "0",
        "transaction_content": "GOOGLE ASIA YOUTUBE",
        "reference_number": "FT1004",
    },
    {
        "id": "2001",
        "transaction_date": "2026-08-12 09:00:00",
        "amount_in": "2000000",
        "amount_out": "0",
        "transaction_content": "SHOPEE",
        "reference_number": "FT2001",
    },
    {
        "id": "2002",
        "transaction_date": "2026-08-12 10:00:00",
        "amount_in": "0",
        "amount_out": "500000",
        "transaction_content": "RUT TIEN",
        "reference_number": "FT2002",
    },
    {
        "id": "2003",
        "transaction_date": "2026-08-12 11:00:00",
        "amount_in": None,
        "transfer_type": "in",
        "transaction_content": "LOI",
        "reference_number": "",
    },
]


@pytest.fixture
def setup(superuser: Any, login: Any, client: Any, monkeypatch: Any) -> Any:
    from app.finance.models.platform_tax_rate import PlatformTaxRate

    youtube = make_platform(superuser, "youtube", "YouTube", pattern="YOUTUBE")
    PlatformTaxRate.objects.create(
        platform=youtube, effective_from=date(2026, 1, 1), tax_withheld=True, rate=5
    )
    connection = make_connection(superuser)
    signed_post(client, connection, payload(1001, "2026-08-10 09:00:00", "GOOGLE ASIA YOUTUBE", 9500000))
    signed_post(client, connection, payload(1004, "2026-08-11 09:00:00", "GOOGLE ASIA YOUTUBE", 9500000))

    def fake(self: Any, token: str, date_from: date, date_to: date) -> Iterator[dict[str, Any]]:
        assert token == "test-token"
        yield from ROWS

    monkeypatch.setattr("app.finance.services.sepay_api_client.SepayApiClient.iter_transactions", fake)
    return login(superuser)


def test_preview_statuses(setup: Any) -> None:
    rows = setup.post(
        "/api/v1/finance/sepay/preview", {"date_from": "2026-08-01", "date_to": "2026-08-31"}, format="json"
    ).json()["data"]
    assert {row["sepay_id"]: row["status"] for row in rows} == {
        "1001": "EXISTS",
        "1004": "CHANGED",
        "2001": "NEW",
        "2003": "INVALID",
    }


def test_import_only_selected_and_changed(setup: Any) -> None:
    body = {"date_from": "2026-08-01", "date_to": "2026-08-31", "ids": ["2001"]}
    assert setup.post("/api/v1/finance/sepay/import", body, format="json").json()["data"] == {
        "created": 1,
        "updated": 0,
        "skipped": 0,
    }
    assert Income.objects.get(sepay_id="1004").amount == 9500000
    result = setup.post(
        "/api/v1/finance/sepay/import", {**body, "ids": ["1004", "1001", "9999"]}, format="json"
    ).json()["data"]
    assert result == {"created": 0, "updated": 1, "skipped": 2}
    changed = Income.objects.get(sepay_id="1004")
    assert changed.amount == 9600000 and changed.tax_amount == 505263 and changed.gross_amount == 10105263


def test_range_too_long(setup: Any) -> None:
    response = setup.post(
        "/api/v1/finance/sepay/preview", {"date_from": "2026-01-01", "date_to": "2026-12-31"}, format="json"
    )
    assert response.json()["error"]["code"] == "FINANCE_SEPAY_RANGE_TOO_LONG"
