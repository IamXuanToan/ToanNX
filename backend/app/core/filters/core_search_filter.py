"""`?search=` không dấu và có giới hạn.

- Không phân biệt dấu: field chữ được so bằng `unaccent(field) ILIKE '%' || unaccent(từ khóa) || '%'`.
  Cả hai phía đi qua **cùng** `unaccent` của PostgreSQL (không tự bỏ dấu ở Python), nên "nguyen" khớp
  "Nguyễn" và ngược lại.
  Cần extension `unaccent` (migration `account/0004_unaccent_extension`).
- Field không phải chữ (id, số...) giữ cách tìm mặc định của DRF.
- Giới hạn độ dài (100 ký tự) và số từ (5) để một request không sinh quá nhiều điều kiện ILIKE.
"""

import operator
from functools import reduce
from typing import Any

from django.contrib.postgres.lookups import Unaccent
from django.core.exceptions import FieldDoesNotExist
from django.db import models
from django.db.models import Q, Value
from django.db.models.constants import LOOKUP_SEP
from rest_framework.filters import SearchFilter
from rest_framework.request import Request

from app.core.exceptions.validation_error import ValidationError

SEARCH_MAX_LENGTH = 100
SEARCH_MAX_TERMS = 5
_ICONTAINS = f"{LOOKUP_SEP}icontains"
_UNACCENT_ICONTAINS = f"{LOOKUP_SEP}unaccent{LOOKUP_SEP}icontains"


def _is_text_field(model: type[models.Model], path: str) -> bool:
    """Đường dẫn field (có thể qua quan hệ, ví dụ `user__email`) kết thúc ở field chữ."""
    opts = model._meta
    field: Any = None
    for part in path.split(LOOKUP_SEP):
        try:
            field = opts.get_field(part)
        except FieldDoesNotExist:
            return False
        if getattr(field, "path_infos", None):
            opts = field.path_infos[-1].to_opts
    return isinstance(field, models.CharField | models.TextField)


class CoreSearchFilter(SearchFilter):
    """SearchFilter của DRF + tìm không dấu + giới hạn độ dài và số từ (vượt → 400 `VALIDATION_ERROR`)."""

    def get_search_terms(self, request: Request) -> list[str]:
        """Tách từ khóa và kiểm giới hạn.

        Args:
            request: Request.

        Returns:
            Danh sách từ khóa.

        Raises:
            ValidationError: Từ khóa quá dài hoặc quá nhiều từ.
        """
        raw = request.query_params.get(self.search_param, "")
        terms: list[str] = list(super().get_search_terms(request))
        if len(raw) > SEARCH_MAX_LENGTH or len(terms) > SEARCH_MAX_TERMS:
            raise ValidationError(
                details={
                    self.search_param: [f"Từ khóa tối đa {SEARCH_MAX_LENGTH} ký tự và {SEARCH_MAX_TERMS} từ."]
                }
            )
        return terms

    def construct_search(self, field_name: str, queryset: Any) -> str:
        """Field chữ dùng `unaccent__icontains`; field khác giữ lookup mặc định của DRF.

        Args:
            field_name: Tên trong `search_fields`.
            queryset: Queryset đang lọc.

        Returns:
            Lookup ORM.
        """
        lookup = str(super().construct_search(field_name, queryset))
        path = lookup.removesuffix(_ICONTAINS)
        if lookup.endswith(_ICONTAINS) and _is_text_field(queryset.model, path):
            return f"{path}{_UNACCENT_ICONTAINS}"
        return lookup

    def filter_queryset(self, request: Request, queryset: Any, view: Any) -> Any:
        """Mỗi từ khóa phải khớp ít nhất một field (giống DRF); field chữ so sau khi `unaccent` cả hai phía.

        Args:
            request: Request.
            queryset: Queryset gốc.
            view: View đang xử lý.

        Returns:
            Queryset đã lọc.
        """
        search_fields = self.get_search_fields(view, request)
        terms = self.get_search_terms(request)
        if not search_fields or not terms:
            return queryset
        lookups = [self.construct_search(str(field), queryset) for field in search_fields]

        def condition(lookup: str, term: str) -> Q:
            value: Any = Unaccent(Value(term)) if lookup.endswith(_UNACCENT_ICONTAINS) else term
            return Q(**{lookup: value})

        base = queryset
        queryset = queryset.filter(
            reduce(
                operator.and_,
                (reduce(operator.or_, (condition(lookup, term) for lookup in lookups)) for term in terms),
            )
        )
        if self.must_call_distinct(queryset, search_fields):
            queryset = base.filter(models.Exists(queryset.filter(pk=models.OuterRef("pk"))))
        return queryset

    def get_schema_operation_parameters(self, view: Any) -> list[dict[str, Any]]:
        """Giữ tài liệu OpenAPI của DRF, thêm giới hạn độ dài."""
        parameters: list[dict[str, Any]] = list(super().get_schema_operation_parameters(view))
        for parameter in parameters:
            parameter.setdefault("schema", {})["maxLength"] = SEARCH_MAX_LENGTH
        return parameters
