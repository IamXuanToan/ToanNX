"""Repository SepayConnection."""

from typing import Any

from django.core.exceptions import ValidationError

from app.core.repositories.core_repository import CoreRepository
from app.finance.models.sepay_connection import SepayConnection


class SepayConnectionRepository(CoreRepository[SepayConnection]):
    """Truy cập dữ liệu SepayConnection."""

    model = SepayConnection

    def find_by_public_id(self, public_id: Any) -> SepayConnection | None:
        """Kết nối theo mã công khai trong URL webhook (kèm chủ)."""
        try:
            return self.get_queryset().select_related("owner").filter(public_id=public_id).first()
        except (ValueError, ValidationError):
            return None
