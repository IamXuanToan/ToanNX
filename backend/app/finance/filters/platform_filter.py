"""Bộ lọc nền tảng."""

import django_filters

from app.core.filters.core_boolean_in_filter import CoreBooleanInFilter
from app.finance.models.platform import Platform


class PlatformFilter(django_filters.FilterSet):
    """Đang dùng."""

    is_active = CoreBooleanInFilter(help_text="Đang dùng.")

    class Meta:
        model = Platform
        fields = ("is_active",)
