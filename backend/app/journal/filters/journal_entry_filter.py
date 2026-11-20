"""Bộ lọc nhật ký: `?resource=account.user,iam.role&module=account&action=UPDATE&actor=<uuid>`."""

from typing import Any

import django_filters
from django.db.models import Q, QuerySet

from app.core.filters.core_char_in_filter import CoreCharInFilter
from app.core.filters.core_choice_in_filter import CoreChoiceInFilter
from app.core.filters.core_in_filter_mixin import FILTER_MAX_VALUES
from app.core.filters.core_uuid_in_filter import CoreUUIDInFilter
from app.journal.models.journal_entry import JournalEntry


class JournalEntryFilter(django_filters.FilterSet):
    """Lọc theo module.model, module, hành động, người thực hiện, bản ghi và khoảng thời gian."""

    resource = CoreCharInFilter(help_text="`<module>.<model>`, nhiều giá trị: `account.user,iam.role`.")
    module = CoreCharInFilter(method="filter_module", help_text="Mã module, nhiều giá trị: `account,iam`.")
    action = CoreChoiceInFilter(choices=JournalEntry.Action.choices, help_text="Hành động, nhiều giá trị.")
    actor = CoreUUIDInFilter(field_name="actor_id", help_text="Id người thực hiện, nhiều giá trị.")
    object_id = django_filters.CharFilter(help_text="Id bản ghi.")
    created_from = django_filters.IsoDateTimeFilter(
        field_name="created_at", lookup_expr="gte", help_text="Từ thời điểm (ISO 8601)."
    )
    created_to = django_filters.IsoDateTimeFilter(
        field_name="created_at", lookup_expr="lte", help_text="Đến thời điểm (ISO 8601)."
    )

    class Meta:
        model = JournalEntry
        fields = ("resource", "module", "action", "actor", "object_id", "created_from", "created_to")

    @staticmethod
    def filter_module(queryset: QuerySet[JournalEntry], name: str, value: Any) -> QuerySet[JournalEntry]:
        """Lọc theo phần `<module>` của `resource`.

        Args:
            queryset: Queryset.
            name: Tên filter.
            value: Danh sách mã module.

        Returns:
            Queryset đã lọc.
        """
        if not value:
            return queryset
        query = Q()
        for module in list(value)[:FILTER_MAX_VALUES]:
            query |= Q(resource__startswith=f"{module}.")
        return queryset.filter(query)
