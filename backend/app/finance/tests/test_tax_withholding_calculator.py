"""Công thức khấu trừ (plan 5.2): T = làm_tròn(N × r / (100 − r)), G = N + T."""

from decimal import Decimal
from types import SimpleNamespace

import pytest

from app.finance.services.tax_withholding_calculator import TaxWithholdingCalculator


@pytest.mark.parametrize(
    ("amount", "rate", "tax", "gross"),
    [
        (9200000, "8", 800000, 10000000),
        (9000000, "10", 1000000, 10000000),
        (9500000, "5", 500000, 10000000),
        (1000000, "5", 52632, 1052632),
        (25600000, "10", 2844444, 28444444),
        (9000000, "8", 782609, 9782609),
    ],
)
def test_withheld(amount: int, rate: str, tax: int, gross: int) -> None:
    entry = SimpleNamespace(tax_withheld=True, rate=Decimal(rate))
    result = TaxWithholdingCalculator().compute(Decimal(amount), entry, True)
    assert (result.tax_status, result.tax_amount, result.gross_amount) == ("WITHHELD", tax, gross)


def test_statuses() -> None:
    calculator = TaxWithholdingCalculator()
    not_withheld = SimpleNamespace(tax_withheld=False, rate=Decimal(0))
    assert calculator.compute(Decimal(3000000), not_withheld, True).tax_status == "NOT_WITHHELD"
    assert calculator.compute(Decimal(1), None, True).tax_status == "NO_RATE"
    assert calculator.compute(Decimal(1), None, False).tax_status == "UNCLASSIFIED"
    assert calculator.compute(None, None, True).tax_status == "PENDING"
    manual = calculator.manual(Decimal(9000000), True, Decimal(10), Decimal(950000))
    assert manual.tax_amount == 950000 and manual.gross_amount == 9950000
