"""`?search=` không dấu và có giới hạn.

- Không phân biệt dấu: field chữ được so bằng `unaccent(field) ILIKE '%từ khóa không dấu%'`, nên "nguyen" khớp
  "Nguyễn" và ngược lại. Cần extension `unaccent` (migration `account/0004_unaccent_extension`).
- Field không phải chữ (id, số...) giữ cách tìm mặc định của DRF.
- Giới hạn độ dài (100 ký tự) và số từ (5) để một request không sinh quá nhiều điều kiện ILIKE.
"""

from typing import Any

from django.core.exceptions import FieldDoesNotExist
from django.db import models
from django.db.models.constants import LOOKUP_SEP
from rest_framework.filters import SearchFilter
from rest_framework.request import Request

from app.core.exceptions.validation_error import ValidationError
from app.core.utils.text import strip_accents

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
        """Tách từ khóa, kiểm giới hạn rồi bỏ dấu.

        Args:
            request: Request.

        Returns:
            Danh sách từ khóa không dấu.

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
        return [strip_accents(term) for term in terms]

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

    def get_schema_operation_parameters(self, view: Any) -> list[dict[str, Any]]:
        """Giữ tài liệu OpenAPI của DRF, thêm giới hạn độ dài."""
        parameters: list[dict[str, Any]] = list(super().get_schema_operation_parameters(view))
        for parameter in parameters:
            parameter.setdefault("schema", {})["maxLength"] = SEARCH_MAX_LENGTH
        return parameters
