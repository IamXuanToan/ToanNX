"""Repository truy vấn EmailTemplate."""

from typing import Any

from django.db.models import Q, QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.system.models.email_template import EmailTemplate


class EmailTemplateRepository(CoreRepository[EmailTemplate]):
    """Truy vấn danh sách mẫu email theo phạm vi SYSTEM/PERSONAL và mã mẫu."""

    model = EmailTemplate

    def accessible_queryset(self, actor: Any) -> QuerySet[EmailTemplate]:
        """Trả mẫu `SYSTEM` dùng cho Portal (`FEEDBACK_THANKS`, `CUSTOM`) đang `ACTIVE` + mẫu của `actor`."""
        return (
            self.get_queryset()
            .select_related("owner")
            .filter(
                Q(
                    scope=EmailTemplate.Scope.SYSTEM,
                    status=EmailTemplate.Status.ACTIVE,
                    category__in=[
                        EmailTemplate.Category.FEEDBACK_THANKS,
                        EmailTemplate.Category.CUSTOM,
                    ],
                )
                | Q(owner=actor)
            )
        )

    def find_active_system_template(self, code: str, locale: str) -> EmailTemplate | None:
        """Tìm mẫu `SYSTEM` đang `ACTIVE` theo `code` (ưu tiên đa ngôn ngữ trong `translations`)."""
        qs = self.get_queryset().filter(
            code=code,
            scope=EmailTemplate.Scope.SYSTEM,
            status=EmailTemplate.Status.ACTIVE,
        )
        return qs.filter(locale=locale).first() or qs.first()

    def exists_code(
        self,
        *,
        code: str,
        locale: str = "vi",
        scope: str,
        owner: Any | None,
        exclude_pk: Any | None = None,
    ) -> bool:
        """Kiểm tra trùng `code` trong cùng phạm vi (`SYSTEM` hoặc của cùng `owner`)."""
        qs = self.get_queryset().filter(code=code, scope=scope)
        if scope == EmailTemplate.Scope.PERSONAL:
            qs = qs.filter(owner=owner)
        if exclude_pk is not None:
            qs = qs.exclude(pk=exclude_pk)
        return qs.exists()
