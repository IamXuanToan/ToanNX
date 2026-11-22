"""Bộ lọc hóa đơn / chứng từ."""

import django_filters

from app.core.filters.core_choice_in_filter import CoreChoiceInFilter
from app.core.filters.core_uuid_in_filter import CoreUUIDInFilter
from app.finance.models.invoice import Invoice


class InvoiceFilter(django_filters.FilterSet):
    """Năm theo ngày lập, loại, nền tảng."""

    year = django_filters.NumberFilter(field_name="issued_on", lookup_expr="year", help_text="Năm.")
    doc_type = CoreChoiceInFilter(choices=Invoice.DocType.choices, help_text="Loại; nhiều giá trị.")
    platform = CoreUUIDInFilter(field_name="platform_id", help_text="Nền tảng; nhiều giá trị.")

    class Meta:
        model = Invoice
        fields = ("year", "doc_type", "platform")
