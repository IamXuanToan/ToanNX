"""Bộ lọc tiền tệ."""

import django_filters

from app.core.filters.core_boolean_in_filter import CoreBooleanInFilter
from app.system.models.currency import Currency


class CurrencyFilter(django_filters.FilterSet):
    """Lọc đang dùng."""

    is_active = CoreBooleanInFilter(help_text="Đang dùng; nhiều giá trị.")

    class Meta:
        model = Currency
        fields = ("is_active",)
