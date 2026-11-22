"""Tính thuế nền tảng đã khấu trừ cho một giao dịch (thuần, không gọi DB).

Số vào tài khoản là tiền đã trừ thuế: N = G × (1 − r/100) ⇒ T = làm_tròn(N × r / (100 − r)), G = N + T.
Module chỉ ghi nhận thuế đã bị khấu trừ, không tính thuế phải nộp.
"""

from decimal import ROUND_HALF_UP, Decimal
from typing import Any

from app.finance.constants.finance_defaults import PERCENT
from app.finance.models.income import Income
from app.finance.types.tax_result import TaxResult

TaxStatus = Income.TaxStatus
ZERO = Decimal(0)
VND_STEP = Decimal(1)


class TaxWithholdingCalculator:
    """Ví dụ: N 9.200.000, r 8% → T 800.000, G 10.000.000."""

    def compute(self, amount: Decimal | None, entry: Any | None, has_platform: bool) -> TaxResult:
        """Theo mốc thuế của nền tảng.

        Args:
            amount: VNĐ thực nhận (None = chưa rõ số tiền).
            entry: Mốc `PlatformTaxRate` áp dụng (None = không có mốc).
            has_platform: Đã nhận diện nền tảng chưa.

        Returns:
            Kết quả khấu trừ.
        """
        if amount is None:
            return TaxResult(TaxStatus.PENDING, False, ZERO, None, None)
        if not has_platform:
            return TaxResult(TaxStatus.UNCLASSIFIED, False, ZERO, ZERO, amount)
        if entry is None:
            return TaxResult(TaxStatus.NO_RATE, False, ZERO, ZERO, amount)
        if not entry.tax_withheld:
            return TaxResult(TaxStatus.NOT_WITHHELD, False, ZERO, ZERO, amount, entry)
        tax = self.tax_amount(amount, Decimal(entry.rate))
        return TaxResult(TaxStatus.WITHHELD, True, Decimal(entry.rate), tax, amount + tax, entry)

    def manual(
        self, amount: Decimal | None, withheld: bool, rate: Decimal, tax_amount: Decimal | None
    ) -> TaxResult:
        """Người dùng tự nhập (ví dụ theo chứng từ); thiếu tiền thuế thì tính từ %."""
        if amount is None:
            return TaxResult(TaxStatus.PENDING, withheld, rate, tax_amount, None)
        if not withheld:
            return TaxResult(TaxStatus.NOT_WITHHELD, False, ZERO, ZERO, amount)
        tax = tax_amount if tax_amount is not None else self.tax_amount(amount, rate)
        return TaxResult(TaxStatus.WITHHELD, True, rate, tax, amount + tax)

    def tax_amount(self, amount: Decimal, rate: Decimal) -> Decimal:
        """T = làm_tròn(N × r / (100 − r))."""
        return (amount * rate / (Decimal(PERCENT) - rate)).quantize(VND_STEP, rounding=ROUND_HALF_UP)
