"""Bộ lọc đường dẫn giữa: `?is_active=true,false`."""

import django_filters

from app.core.filters.core_boolean_in_filter import CoreBooleanInFilter
from app.modules.custom_pages.models.page_path import PagePath


class PagePathFilter(django_filters.FilterSet):
    """Lọc theo trạng thái bật."""

    is_active = CoreBooleanInFilter(help_text="Nhiều giá trị: `true,false`.")

    class Meta:
        model = PagePath
        fields = ("is_active",)
