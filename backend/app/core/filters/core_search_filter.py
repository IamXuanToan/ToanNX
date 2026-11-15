"""`?search=` có giới hạn: chặn một request sinh quá nhiều điều kiện ILIKE."""

from typing import Any

from rest_framework.filters import SearchFilter
from rest_framework.request import Request

from app.core.exceptions.validation_error import ValidationError

SEARCH_MAX_LENGTH = 100
SEARCH_MAX_TERMS = 5


class CoreSearchFilter(SearchFilter):
    """SearchFilter của DRF + giới hạn độ dài (100 ký tự) và số từ (5). Vượt → 400 `VALIDATION_ERROR`."""

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

    def get_schema_operation_parameters(self, view: Any) -> list[dict[str, Any]]:
        """Giữ tài liệu OpenAPI của DRF, thêm giới hạn độ dài."""
        parameters: list[dict[str, Any]] = list(super().get_schema_operation_parameters(view))
        for parameter in parameters:
            parameter.setdefault("schema", {})["maxLength"] = SEARCH_MAX_LENGTH
        return parameters
