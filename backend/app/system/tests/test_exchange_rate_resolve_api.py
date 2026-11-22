"""Tra tỷ giá: đệm DB, gọi Vietcombank, lùi ngày nghỉ tối đa 7 ngày, lỗi thì báo nhập tay."""

from datetime import date
from decimal import Decimal
from typing import Any
from unittest.mock import patch

import pytest
import requests

from app.system.models.currency import Currency
from app.system.models.exchange_rate import ExchangeRate

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/exchange-rates/resolve"
CLIENT = "app.system.services.vietcombank_rate_client.VietcombankRateClient.transfer_buy_rate"


def test_falls_back_and_caches(superuser: Any, login: Any) -> None:
    usd = Currency.objects.get(code="USD")
    api = login(superuser)

    def fake(self: Any, code: str, day: date) -> Decimal | None:
        return Decimal(25650) if day == date(2026, 12, 25) else None

    with patch(CLIENT, fake):
        data = api.get(URL, {"currency_id": str(usd.pk), "date": "2026-12-27"}).json()["data"]
    assert data["rate_date"] == "2026-12-25" and Decimal(data["rate"]) == 25650
    assert (
        ExchangeRate.objects.filter(rate_date=date(2026, 12, 25), source="VIETCOMBANK_TRANSFER_BUY").count()
        == 1
    )
    with patch(CLIENT, side_effect=AssertionError("không được gọi lại")):
        assert api.get(URL, {"currency_id": str(usd.pk), "date": "2026-12-25"}).status_code == 200


def test_unavailable(superuser: Any, login: Any) -> None:
    usd = Currency.objects.get(code="USD")
    with patch(CLIENT, side_effect=requests.ConnectionError):
        response = login(superuser).get(URL, {"currency_id": str(usd.pk), "date": "2026-12-27"})
    assert response.json()["error"]["code"] == "SYSTEM_EXCHANGE_RATE_UNAVAILABLE"


def test_api_rows_are_read_only(superuser: Any, login: Any) -> None:
    usd = Currency.objects.get(code="USD")
    row = ExchangeRate.objects.create(
        currency=usd, rate_date="2026-01-01", rate=25000, source="VIETCOMBANK_TRANSFER_BUY"
    )
    response = login(superuser).patch(f"/api/v1/system/exchange-rates/{row.pk}", {"rate": "1"}, format="json")
    assert response.json()["error"]["code"] == "SYSTEM_EXCHANGE_RATE_READ_ONLY"
