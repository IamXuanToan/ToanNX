"""Giới hạn số giá trị của bộ lọc nhiều giá trị (`?status=A,B,C`)."""

from typing import Any

from app.core.exceptions.validation_error import ValidationError

FILTER_MAX_VALUES = 50


class CoreInFilterMixin:
    """Thêm kiểm tra ≤ 50 giá trị cho các bộ lọc `Core*InFilter`. Vượt → 400 `VALIDATION_ERROR`."""

    field_name: Any

    def filter(self, qs: Any, value: Any) -> Any:
        """Từ chối danh sách quá dài rồi lọc như bình thường.

        Args:
            qs: Queryset.
            value: Danh sách giá trị đã tách dấu phẩy.

        Returns:
            Queryset đã lọc.

        Raises:
            ValidationError: Quá 50 giá trị.
        """
        self.ensure_max_values(value)
        return super().filter(qs, value)  # type: ignore[misc]  # Filter của django-filter

    def ensure_max_values(self, value: Any) -> None:
        """Ném lỗi khi danh sách vượt giới hạn (lớp con gọi trước khi biến đổi giá trị).

        Raises:
            ValidationError: Quá 50 giá trị.
        """
        if value and len(value) > FILTER_MAX_VALUES:
            raise ValidationError(details={self.field_name: [f"Tối đa {FILTER_MAX_VALUES} giá trị."]})
