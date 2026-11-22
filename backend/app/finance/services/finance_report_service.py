"""Báo cáo thu nhập theo năm/tháng (VNĐ): tổng thu nhập, đã khấu trừ (+ tiền thuế bị khấu trừ), chưa khấu trừ.

Không tính thuế phải nộp. Chỉ cộng giao dịch đã có số tiền (`amount_status = OK`); "chưa khấu trừ" gồm cả phần
chưa nhận diện (tách riêng một dòng). Kiểm luôn đúng: đã khấu trừ + chưa khấu trừ = tổng thu nhập.
"""

from decimal import Decimal
from typing import Any

from django.db.models import Count, DecimalField, Q, QuerySet, Sum, Value
from django.db.models.functions import Coalesce, ExtractMonth

from app.finance.models.income import Income
from app.finance.services.income_service import IncomeService

ZERO = Value(Decimal(0), output_field=DecimalField(max_digits=18, decimal_places=4))
MONTHS = 12
WITHHELD = Q(tax_withheld=True)
NOT_WITHHELD = Q(tax_withheld=False)
UNCLASSIFIED = Q(tax_status=Income.TaxStatus.UNCLASSIFIED)
NEEDS_REVIEW = Q(amount_status=Income.AmountStatus.UNKNOWN) | Q(
    tax_status__in=(Income.TaxStatus.UNCLASSIFIED, Income.TaxStatus.NO_RATE)
)


def _totals() -> dict[str, Any]:
    """Các tổng dùng chung cho mọi nhóm."""
    return {
        "count": Count("id"),
        "total": Coalesce(Sum("amount"), ZERO),
        "withheld": Coalesce(Sum("amount", filter=WITHHELD), ZERO),
        "tax": Coalesce(Sum("tax_amount", filter=WITHHELD), ZERO),
        "not_withheld": Coalesce(Sum("amount", filter=NOT_WITHHELD), ZERO),
        "unclassified": Coalesce(Sum("amount", filter=UNCLASSIFIED), ZERO),
    }


class FinanceReportService:
    """Số liệu trong phạm vi xem thu nhập của người gọi (của mình, hoặc mọi người với `manage_all`)."""

    def __init__(self, income_service: IncomeService | None = None) -> None:
        """Khởi tạo phụ thuộc."""
        self.income_service = income_service or IncomeService()

    def summary(self, actor: Any, year: int, month: int | None) -> dict[str, Any]:
        """Thẻ tổng + theo nền tảng (dòng con theo %) + theo tháng + theo tiền tệ."""
        scoped = self._period(actor, year, month)
        ok = scoped.filter(amount_status=Income.AmountStatus.OK)
        totals = ok.aggregate(**_totals())
        totals["needs_review"] = scoped.filter(NEEDS_REVIEW).count()
        by_platform = list(
            ok.values("platform_id", "platform__name", "tax_withheld", "tax_rate")
            .annotate(**_totals())
            .order_by("platform__name", "tax_rate")
        )
        by_currency = list(
            ok.values("currency__code", "currency__symbol", "currency__decimal_places")
            .annotate(
                count=Count("id"),
                original=Coalesce(Sum("original_amount"), ZERO),
                total=Coalesce(Sum("amount"), ZERO),
            )
            .order_by("currency__code")
        )
        return {
            "year": year,
            "month": month,
            "totals": totals,
            "by_platform": [self._platform_row(dict(row)) for row in by_platform],
            "by_month": self._months(ok) if month is None else [],
            "by_currency": [
                {
                    "currency": row["currency__code"],
                    "symbol": row["currency__symbol"],
                    "decimal_places": row["currency__decimal_places"],
                    "count": row["count"],
                    "original": row["original"],
                    "total": row["total"],
                }
                for row in by_currency
            ],
        }

    def monthly(self, actor: Any, year: int) -> dict[str, Any]:
        """12 tháng năm chọn và năm trước + thu theo nền tảng từng tháng (dashboard)."""
        current = self._period(actor, year, None).filter(amount_status=Income.AmountStatus.OK)
        previous = self._period(actor, year - 1, None).filter(amount_status=Income.AmountStatus.OK)
        platforms = (
            current.annotate(month=ExtractMonth("received_date"))
            .values("month", "platform__name")
            .annotate(total=Coalesce(Sum("amount"), ZERO))
            .order_by("month")
        )
        return {
            "year": year,
            "months": self._months(current),
            "previous_months": self._months(previous),
            "by_platform": [
                {"month": row["month"], "platform": row["platform__name"] or "", "total": row["total"]}
                for row in platforms
            ],
        }

    def _period(self, actor: Any, year: int, month: int | None) -> QuerySet[Income]:
        queryset = self.income_service.get_queryset_for(actor).filter(received_date__year=year)
        return queryset.filter(received_date__month=month) if month else queryset

    def _months(self, queryset: QuerySet[Income]) -> list[dict[str, Any]]:
        """Đủ 12 tháng (tháng không có giao dịch = 0)."""
        rows: dict[int, dict[str, Any]] = {
            int(row["month"]): dict(row)
            for row in queryset.annotate(month=ExtractMonth("received_date"))
            .values("month")
            .annotate(**_totals())
        }
        empty: dict[str, Any] = {
            "count": 0,
            "total": Decimal(0),
            "withheld": Decimal(0),
            "tax": Decimal(0),
            "not_withheld": Decimal(0),
            "unclassified": Decimal(0),
        }
        return [
            {"month": month, **{key: rows.get(month, empty)[key] for key in empty}}
            for month in range(1, MONTHS + 1)
        ]

    @staticmethod
    def _platform_row(row: dict[str, Any]) -> dict[str, Any]:
        return {
            "platform_id": row["platform_id"],
            "platform": row["platform__name"] or "",
            "tax_withheld": row["tax_withheld"],
            "tax_rate": row["tax_rate"],
            **{
                key: row[key] for key in ("count", "total", "withheld", "tax", "not_withheld", "unclassified")
            },
        }
