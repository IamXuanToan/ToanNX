"""Bộ lọc Chủ đề nhắc việc."""

import django_filters

from app.core.filters.core_boolean_in_filter import CoreBooleanInFilter
from app.workspace.models.reminder_topic import ReminderTopic


class ReminderTopicFilter(django_filters.FilterSet):
    """Lọc chủ đề theo cờ mặc định hệ thống."""

    is_system = CoreBooleanInFilter(help_text="Chủ đề mặc định hệ thống (`true`/`false`).")

    class Meta:
        model = ReminderTopic
        fields = ("is_system",)
