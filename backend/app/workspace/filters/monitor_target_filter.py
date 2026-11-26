"""Bộ lọc cho Mục tiêu giám sát Uptime/HTTP."""

import django_filters

from app.core.filters.core_boolean_in_filter import CoreBooleanInFilter
from app.core.filters.core_choice_in_filter import CoreChoiceInFilter
from app.core.filters.core_uuid_in_filter import CoreUUIDInFilter
from app.workspace.models.monitor_target import MonitorTarget


class MonitorTargetFilter(django_filters.FilterSet):
    """Lọc theo trạng thái gần nhất, trạng thái bật/tắt, phương thức HTTP và chủ sở hữu."""

    last_status = CoreChoiceInFilter(
        choices=MonitorTarget.Status.choices,
        help_text="Trạng thái kiểm tra gần nhất (HEALTHY, DEGRADED, DOWN, UNKNOWN).",
    )
    is_active = CoreBooleanInFilter(
        help_text="Đang bật giám sát (`true`/`false`).",
    )
    method = CoreChoiceInFilter(
        choices=MonitorTarget.Method.choices,
        help_text="Phương thức HTTP (`GET`, `HEAD`).",
    )
    owner = CoreUUIDInFilter(
        field_name="owner_id",
        help_text="ID chủ sở hữu (chỉ áp dụng khi có quyền manage_all).",
    )

    class Meta:
        model = MonitorTarget
        fields = ("last_status", "is_active", "method", "owner")
