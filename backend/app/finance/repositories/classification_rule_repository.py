"""Repository ClassificationRule."""

from typing import Any

from django.db.models import QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.finance.models.classification_rule import ClassificationRule


class ClassificationRuleRepository(CoreRepository[ClassificationRule]):
    """Truy cập dữ liệu ClassificationRule."""

    model = ClassificationRule

    def get_queryset(self) -> QuerySet[ClassificationRule]:
        """Kèm chủ sở hữu và nền tảng."""
        return super().get_queryset().select_related("owner", "platform")

    def active_for(self, owner_id: Any) -> list[ClassificationRule]:
        """Quy tắc đang bật của một người theo thứ tự ưu tiên."""
        return list(
            self.get_queryset().filter(owner_id=owner_id, is_active=True).order_by("-priority", "created_at")
        )
