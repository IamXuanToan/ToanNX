"""Bộ lọc cho danh sách EmailTemplate."""

from typing import Any

import django_filters
from django.db.models import Q

from app.core.filters.core_char_in_filter import CoreCharInFilter
from app.core.filters.core_uuid_in_filter import CoreUUIDInFilter
from app.system.models.email_template import EmailTemplate


class EmailTemplateFilter(django_filters.FilterSet):
    """Lọc theo trạng thái, phạm vi, nhóm, ngôn ngữ, chủ sở hữu và chế độ Client Portal."""

    status = CoreCharInFilter(field_name="status")
    scope = CoreCharInFilter(field_name="scope")
    category = CoreCharInFilter(field_name="category")
    locale = CoreCharInFilter(field_name="locale")
    owner = CoreUUIDInFilter(field_name="owner_id")
    portal_only = django_filters.BooleanFilter(method="filter_portal_only")

    class Meta:
        """Khai báo model và trường lọc."""

        model = EmailTemplate
        fields = ("status", "scope", "category", "locale", "owner", "portal_only")

    def filter_portal_only(self, queryset: Any, name: str, value: bool) -> Any:
        """Chế độ Client Portal: kể cả Admin cũng chỉ thấy mẫu cá nhân của mình + mẫu Portal được phép."""
        if not value:
            return queryset
        request = getattr(self, "request", None)
        user = getattr(request, "user", None) if request is not None else None
        if user is None or not user.is_authenticated:
            return queryset.none()
        return queryset.filter(
            Q(
                scope=EmailTemplate.Scope.SYSTEM,
                status=EmailTemplate.Status.ACTIVE,
                category__in=[
                    EmailTemplate.Category.FEEDBACK_THANKS,
                    EmailTemplate.Category.CUSTOM,
                ],
            )
            | Q(owner=user)
        )
