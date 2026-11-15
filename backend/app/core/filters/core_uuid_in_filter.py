"""Lọc UUID nhiều giá trị: `?role=<uuid>,<uuid>`."""

from typing import Any

import django_filters


class CoreUUIDInFilter(django_filters.BaseInFilter, django_filters.UUIDFilter):
    """Nhận danh sách UUID phân tách bằng dấu phẩy, lọc `field__in`."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """Mặc định `lookup_expr="in"`.

        Args:
            *args: Tham số của django-filter.
            **kwargs: Tham số của django-filter.
        """
        kwargs.setdefault("lookup_expr", "in")
        super().__init__(*args, **kwargs)
