"""Fixture dùng chung cho module tests của `app.workspace`."""

from datetime import date
from decimal import Decimal
from typing import Any

import pytest

from app.system.models.currency import Currency


@pytest.fixture(autouse=True)
def _fake_vietcombank(monkeypatch: Any) -> None:
    """Chặn gọi HTTP Vietcombank thật trong test Workspace để chỉ đọc DB ExchangeRate."""

    def _none_rate(self: Any, currency_code: str, day: date) -> Decimal | None:
        return None

    monkeypatch.setattr(
        "app.system.services.vietcombank_rate_client.VietcombankRateClient.transfer_buy_rate",
        _none_rate,
    )


@pytest.fixture
def vnd(db: Any) -> Currency:
    """Tiền tệ gốc VND."""
    return Currency.objects.get(code="VND")


@pytest.fixture
def usd(db: Any) -> Currency:
    """Tiền tệ USD đã seed sẵn."""
    return Currency.objects.get(code="USD")
