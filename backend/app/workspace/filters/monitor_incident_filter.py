"""Bộ lọc cho Sự cố giám sát Uptime/HTTP."""

from typing import Any

import django_filters
from django.db.models import Q, QuerySet

from app.core.filters.core_boolean_in_filter import CoreBooleanInFilter
from app.core.filters.core_uuid_in_filter import CoreUUIDInFilter
from app.workspace.models.monitor_incident import MonitorIncident


class MonitorIncidentFilter(django_filters.FilterSet):
    """Lọc theo mục tiêu, mã HTTP lỗi, trạng thái đã phục hồi (`resolved`) và chủ sở hữu."""

    target = CoreUUIDInFilter(
        field_name="target_id",
        help_text="ID mục tiêu giám sát.",
    )
    status_code = django_filters.NumberFilter(
        field_name="status_code",
        help_text="Mã HTTP lỗi ghi nhận.",
    )
    resolved = CoreBooleanInFilter(
        method="filter_resolved",
        help_text="Đã phục hồi (`true` = đã có resolved_at, `false` = chưa phục hồi).",
    )
    owner = CoreUUIDInFilter(
        field_name="owner_id",
        help_text="ID chủ sở hữu (chỉ áp dụng khi có quyền manage_all).",
    )

    class Meta:
        model = MonitorIncident
        fields = ("target", "status_code", "resolved", "owner")

    @staticmethod
    def filter_resolved(
        queryset: QuerySet[MonitorIncident], name: str, value: Any
    ) -> QuerySet[MonitorIncident]:
        """Lọc sự cố đã đóng (`resolved_at IS NOT NULL`) hoặc đang mở (`resolved_at IS NULL`)."""
        if not value:
            return queryset
        wants = {item == "true" for item in value}
        if wants == {True, False}:
            return queryset
        if wants == {True}:
            return queryset.filter(Q(resolved_at__isnull=False))
        return queryset.filter(Q(resolved_at__isnull=True))
