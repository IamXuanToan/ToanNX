"""Lọc theo lựa chọn nhiều giá trị: `?status=ACTIVE,EXPIRED` (giá trị ngoài `choices` → 400)."""

from typing import Any

import django_filters

from app.core.filters.core_in_filter_mixin import CoreInFilterMixin


class CoreChoiceInFilter(CoreInFilterMixin, django_filters.BaseInFilter, django_filters.ChoiceFilter):
    """Nhận danh sách lựa chọn phân tách bằng dấu phẩy, kiểm từng giá trị theo `choices`, lọc `field__in`."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """Mặc định `lookup_expr="in"`.

        Args:
            *args: Tham số của django-filter.
            **kwargs: Tham số của django-filter (bắt buộc có `choices`).
        """
        kwargs.setdefault("lookup_expr", "in")
        super().__init__(*args, **kwargs)
