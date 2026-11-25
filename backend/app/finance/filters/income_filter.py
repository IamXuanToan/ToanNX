"""Bộ lọc giao dịch thu nhập."""

from typing import Any

import django_filters
from django.db.models import Q, QuerySet

from app.core.filters.core_boolean_in_filter import CoreBooleanInFilter
from app.core.filters.core_choice_in_filter import CoreChoiceInFilter
from app.core.filters.core_uuid_in_filter import CoreUUIDInFilter
from app.finance.models.income import Income

NEEDS_REVIEW = Q(amount_status=Income.AmountStatus.UNKNOWN) | Q(
    tax_status__in=(Income.TaxStatus.UNCLASSIFIED, Income.TaxStatus.NO_RATE)
)


class IncomeFilter(django_filters.FilterSet):
    """Năm/tháng theo ngày VN; bộ lọc nhiều giá trị phân tách dấu phẩy."""

    year = django_filters.NumberFilter(field_name="received_date", lookup_expr="year", help_text="Năm.")
    month = django_filters.NumberFilter(field_name="received_date", lookup_expr="month", help_text="Tháng.")
    date = django_filters.DateFilter(field_name="received_date", help_text="Ngày (kiểm trùng khi nhập tay).")
    amount = django_filters.NumberFilter(field_name="amount", help_text="VNĐ thực nhận (kiểm trùng).")
    owner = CoreUUIDInFilter(field_name="owner_id", help_text="Người dùng sở hữu; nhiều giá trị.")
    platform = CoreUUIDInFilter(field_name="platform_id", help_text="Nền tảng; nhiều giá trị.")
    currency = CoreUUIDInFilter(field_name="currency_id", help_text="Tiền tệ; nhiều giá trị.")
    tax_status = CoreChoiceInFilter(
        choices=Income.TaxStatus.choices, help_text="Trạng thái thuế; nhiều giá trị."
    )
    source = CoreChoiceInFilter(choices=Income.Source.choices, help_text="Nguồn; nhiều giá trị.")
    amount_status = CoreChoiceInFilter(choices=Income.AmountStatus.choices, help_text="Trạng thái số tiền.")
    tax_withheld = CoreBooleanInFilter(help_text="Đã khấu trừ.")
    is_tax_manual = CoreBooleanInFilter(help_text="Thuế nhập tay.")
    tax_rate = django_filters.NumberFilter(field_name="tax_rate", help_text="% khấu trừ.")
    needs_review = django_filters.BooleanFilter(method="filter_needs_review", help_text="Cần xử lý.")
    has_invoice = django_filters.BooleanFilter(method="filter_has_invoice", help_text="Có chứng từ.")

    class Meta:
        model = Income
        fields = (
            "year",
            "month",
            "owner",
            "platform",
            "currency",
            "tax_status",
            "source",
            "amount_status",
            "tax_withheld",
        )

    def filter_needs_review(self, queryset: QuerySet[Income], name: str, value: Any) -> QuerySet[Income]:
        """Không rõ số tiền, chưa nhận diện, chưa có mốc thuế."""
        return queryset.filter(NEEDS_REVIEW) if value else queryset.exclude(NEEDS_REVIEW)

    def filter_has_invoice(self, queryset: QuerySet[Income], name: str, value: Any) -> QuerySet[Income]:
        """Có/không có chứng từ chưa xóa."""
        linked = Q(invoices__isnull=False, invoices__deleted_at__isnull=True)
        return queryset.filter(linked).distinct() if value else queryset.exclude(linked)
