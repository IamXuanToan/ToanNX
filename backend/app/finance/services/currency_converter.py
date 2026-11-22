"""Quy đổi số gốc sang VNĐ (thuần, không gọi DB/HTTP).

- `to_vnd`: N = làm_tròn(A × R) tới đồng, ROUND_HALF_UP.
- `implied_rate`: R = làm_tròn(N / A, 6) — tiền đã về VNĐ, người dùng ghi thêm số ngoại tệ gốc (N giữ nguyên).
"""

from decimal import ROUND_HALF_UP, Decimal

VND_STEP = Decimal(1)
RATE_STEP = Decimal("0.000001")


class CurrencyConverter:
    """Mọi phép tính bằng Decimal."""

    def round_original(self, value: Decimal, decimal_places: int) -> Decimal:
        """Làm tròn số gốc theo số lẻ của tiền tệ."""
        return value.quantize(Decimal(1).scaleb(-decimal_places), rounding=ROUND_HALF_UP)

    def to_vnd(self, original_amount: Decimal, rate: Decimal) -> Decimal:
        """Số gốc × tỷ giá, làm tròn tới đồng."""
        return (original_amount * rate).quantize(VND_STEP, rounding=ROUND_HALF_UP)

    def implied_rate(self, amount_vnd: Decimal, original_amount: Decimal) -> Decimal:
        """Tỷ giá suy ra từ số VNĐ ngân hàng đã trả."""
        return (amount_vnd / original_amount).quantize(RATE_STEP, rounding=ROUND_HALF_UP)
