"""Tiền tệ: khóa tiền tệ gốc, không xóa tiền tệ đang dùng."""

from typing import Any

import pytest

from app.system.models.currency import Currency
from app.system.models.exchange_rate import ExchangeRate

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/currencies"


def test_base_currency_locked(superuser: Any, login: Any) -> None:
    api = login(superuser)
    vnd = Currency.objects.get(code="VND")
    assert (
        api.patch(f"{URL}/{vnd.pk}", {"is_active": False}, format="json").json()["error"]["code"]
        == "SYSTEM_CURRENCY_BASE_LOCKED"
    )
    assert api.delete(f"{URL}/{vnd.pk}").json()["error"]["code"] == "SYSTEM_CURRENCY_BASE_LOCKED"
    assert api.patch(f"{URL}/{vnd.pk}", {"name": "Việt Nam đồng"}, format="json").status_code == 200


def test_currency_in_use(superuser: Any, login: Any) -> None:
    usd = Currency.objects.get(code="USD")
    ExchangeRate.objects.create(currency=usd, rate_date="2026-01-01", rate=25000, source="MANUAL")
    response = login(superuser).delete(f"{URL}/{usd.pk}")
    assert response.json()["error"]["code"] == "SYSTEM_CURRENCY_IN_USE"
