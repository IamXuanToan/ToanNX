"""Lọc chuỗi nhiều giá trị: `?module=iam,account`."""

from typing import Any

import django_filters

from app.core.filters.core_in_filter_mixin import CoreInFilterMixin


class CoreCharInFilter(CoreInFilterMixin, django_filters.BaseInFilter, django_filters.CharFilter):
    """Nhận danh sách chuỗi phân tách bằng dấu phẩy, lọc `field__in`."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """Mặc định `lookup_expr="in"`.

        Args:
            *args: Tham số của django-filter.
            **kwargs: Tham số của django-filter.
        """
        kwargs.setdefault("lookup_expr", "in")
        super().__init__(*args, **kwargs)
