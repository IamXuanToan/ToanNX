"""Fixture riêng của module Tài chính: không gọi SePay/Vietcombank/Firebase thật."""

from datetime import date
from decimal import Decimal
from typing import Any

import pytest

from app.finance.tests.helpers.finance_test_helper import FAKE_RATES


@pytest.fixture(autouse=True)
def _finance_settings(settings: Any) -> None:
    """Môi trường sandbox SePay (Firebase/R2 đã tắt ở `backend/conftest.py`)."""
    settings.SEPAY_ENV = "sandbox"


@pytest.fixture(autouse=True)
def _fake_vietcombank(monkeypatch: Any) -> dict[date, Decimal]:
    """Tỷ giá Vietcombank giả: chỉ các ngày trong FAKE_RATES có số."""
    rates = dict(FAKE_RATES)

    def fake(self: Any, currency_code: str, day: date) -> Decimal | None:
        return rates.get(day) if currency_code == "USD" else None

    monkeypatch.setattr(
        "app.system.services.vietcombank_rate_client.VietcombankRateClient.transfer_buy_rate", fake
    )
    return rates


@pytest.fixture(autouse=True)
def _without_seed_platforms(db: Any) -> None:
    """Bỏ nền tảng mẫu của migration để mỗi test tự dựng dữ liệu."""
    from app.finance.models.platform import Platform

    Platform.objects.all().delete()
