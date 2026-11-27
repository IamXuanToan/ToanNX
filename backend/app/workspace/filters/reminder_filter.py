"""Bộ lọc cho Nhắc việc cá nhân."""

import django_filters

from app.core.filters.core_boolean_in_filter import CoreBooleanInFilter
from app.core.filters.core_choice_in_filter import CoreChoiceInFilter
from app.core.filters.core_uuid_in_filter import CoreUUIDInFilter
from app.workspace.models.reminder import Reminder


class ReminderFilter(django_filters.FilterSet):
    """Lọc theo độ ưu tiên, hoàn thành, lặp lại, khoảng ngày đến hạn và chủ sở hữu."""

    priority = CoreChoiceInFilter(
        choices=Reminder.Priority.choices,
        help_text="Độ ưu tiên (LOW, MEDIUM, HIGH, URGENT).",
    )
    is_completed = CoreBooleanInFilter(
        help_text="Đã hoàn thành (`true`/`false`).",
    )
    recurrence = CoreChoiceInFilter(
        choices=Reminder.Recurrence.choices,
        help_text="Chu kỳ lặp lại.",
    )
    due_from = django_filters.DateFilter(
        field_name="due_date",
        lookup_expr="gte",
        help_text="Ngày đến hạn từ (YYYY-MM-DD).",
    )
    due_to = django_filters.DateFilter(
        field_name="due_date",
        lookup_expr="lte",
        help_text="Ngày đến hạn đến (YYYY-MM-DD).",
    )
    owner = CoreUUIDInFilter(
        field_name="owner_id",
        help_text="ID chủ sở hữu (chỉ áp dụng khi có quyền manage_all).",
    )

    class Meta:
        model = Reminder
        fields = ("priority", "is_completed", "recurrence", "due_from", "due_to", "owner")
