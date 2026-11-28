"""Repository truy vấn Language."""

from typing import Any

from app.core.repositories.core_repository import CoreRepository
from app.system.models.language import Language


class LanguageRepository(CoreRepository[Language]):
    """Truy vấn danh mục ngôn ngữ hệ thống."""

    model = Language

    def find_by_code(self, code: str) -> Language | None:
        """Tìm ngôn ngữ theo mã `code` viết thường."""
        return self.get_queryset().filter(code=code.strip().lower()).first()

    def exists_code(self, code: str, *, exclude_pk: Any | None = None) -> bool:
        """Kiểm tra trùng mã ngôn ngữ."""
        qs = self.get_queryset().filter(code=code.strip().lower())
        if exclude_pk is not None:
            qs = qs.exclude(pk=exclude_pk)
        return qs.exists()

    def list_active(self) -> list[Language]:
        """Trả danh sách ngôn ngữ đang bật theo thứ tự hiển thị."""
        return list(self.get_queryset().filter(is_active=True).order_by("sort_order", "code"))
