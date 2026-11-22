"""Quy đổi (plan 4.4): N = làm_tròn(A × R); BANK_ACTUAL R = N / A."""

from decimal import Decimal

import pytest

from app.finance.services.currency_converter import CurrencyConverter


@pytest.mark.parametrize(
    ("original", "rate", "vnd"),
    [("1000.00", "25600", 25600000), ("1250.50", "25600", 32012800), ("333.33", "25611.5", 8537081)],
)
def test_to_vnd(original: str, rate: str, vnd: int) -> None:
    assert CurrencyConverter().to_vnd(Decimal(original), Decimal(rate)) == vnd


def test_implied_rate_and_rounding() -> None:
    converter = CurrencyConverter()
    assert converter.implied_rate(Decimal(12800000), Decimal("500.00")) == Decimal("25600.000000")
    assert converter.round_original(Decimal("1.005"), 2) == Decimal("1.01")
