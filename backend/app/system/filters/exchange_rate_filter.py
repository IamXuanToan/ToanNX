"""Bộ lọc tỷ giá."""

import django_filters

from app.core.filters.core_char_in_filter import CoreCharInFilter
from app.core.filters.core_uuid_in_filter import CoreUUIDInFilter
from app.system.models.exchange_rate import ExchangeRate


class ExchangeRateFilter(django_filters.FilterSet):
    """Lọc theo tiền tệ, nguồn (nhiều giá trị) và khoảng ngày."""

    currency = CoreUUIDInFilter(field_name="currency_id", help_text="Tiền tệ; nhiều giá trị.")
    source = CoreCharInFilter(help_text="Nguồn; nhiều giá trị.")
    date_from = django_filters.DateFilter(field_name="rate_date", lookup_expr="gte", help_text="Từ ngày.")
    date_to = django_filters.DateFilter(field_name="rate_date", lookup_expr="lte", help_text="Đến ngày.")

    class Meta:
        model = ExchangeRate
        fields = ("currency", "source", "date_from", "date_to")
