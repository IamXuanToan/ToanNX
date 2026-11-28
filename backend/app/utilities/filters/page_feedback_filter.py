"""Bộ lọc cho danh sách PageFeedback."""

from typing import Any

import django_filters

from app.core.filters.core_char_in_filter import CoreCharInFilter
from app.core.filters.core_uuid_in_filter import CoreUUIDInFilter
from app.utilities.models.page_feedback import PageFeedback
from app.utilities.permissions.page_feedback_permission import PageFeedbackPermission


class PageFeedbackFilter(django_filters.FilterSet):
    """Lọc theo trạng thái, loại góp ý, đối tượng, người sở hữu và trạng thái cảm ơn."""

    status = CoreCharInFilter(field_name="status")
    feedback_type = CoreCharInFilter(field_name="feedback_type")
    target_type = CoreCharInFilter(field_name="target_type")
    owner = CoreUUIDInFilter(method="filter_owner")
    thanked = django_filters.BooleanFilter(method="filter_thanked")

    class Meta:
        """Khai báo model và trường lọc."""

        model = PageFeedback
        fields = ("status", "feedback_type", "target_type", "owner", "thanked")

    def filter_owner(self, queryset, name: str, value: list[Any]):  # type: ignore[no-untyped-def]
        """Chỉ Admin có `manage_all` mới được lọc theo `?owner=`."""
        request = getattr(self, "request", None)
        user = getattr(request, "user", None) if request is not None else None
        if user is None or not user.is_authenticated:
            return queryset
        if not getattr(user, "is_superuser", False) and not user.has_perm(
            PageFeedbackPermission.MANAGE_ALL.code
        ):
            return queryset
        return queryset.filter(target_owner_id__in=value)

    def filter_thanked(self, queryset, name: str, value: bool):  # type: ignore[no-untyped-def]
        """Lọc góp ý đã gửi lời cảm ơn hay chưa."""
        if value is True:
            return queryset.filter(thanked_at__isnull=False)
        if value is False:
            return queryset.filter(thanked_at__isnull=True)
        return queryset
