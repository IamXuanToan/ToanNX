"""Lọc boolean nhiều giá trị: `?is_active=true,false` (giá trị khác `true`/`false` → 400)."""

from typing import Any

import django_filters
from django.db.models import QuerySet

BOOLEAN_CHOICES = (("true", "true"), ("false", "false"))


class CoreBooleanInFilter(django_filters.BaseInFilter, django_filters.ChoiceFilter):
    """Nhận `true`/`false` phân tách bằng dấu phẩy, lọc `field__in` với giá trị boolean.

    Dựng trên `ChoiceFilter` vì widget của `BooleanFilter` đổi chuỗi thành bool trước khi tách dấu phẩy.
    """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """Cố định lựa chọn `true`/`false`, mặc định `lookup_expr="in"`.

        Args:
            *args: Tham số của django-filter.
            **kwargs: Tham số của django-filter.
        """
        kwargs.setdefault("lookup_expr", "in")
        kwargs["choices"] = BOOLEAN_CHOICES
        super().__init__(*args, **kwargs)

    def filter(self, qs: QuerySet[Any], value: Any) -> QuerySet[Any]:
        """Đổi chuỗi đã kiểm sang bool rồi lọc.

        Args:
            qs: Queryset.
            value: Danh sách `true`/`false` (rỗng thì không lọc).

        Returns:
            Queryset đã lọc.
        """
        if value:
            value = list(dict.fromkeys(item == "true" for item in value))
        return super().filter(qs, value)
