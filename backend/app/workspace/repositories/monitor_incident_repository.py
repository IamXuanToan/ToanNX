"""Repository Sự cố giám sát Uptime/HTTP."""

from datetime import datetime
from typing import Any

from django.db.models import QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.workspace.models.monitor_incident import MonitorIncident


class MonitorIncidentRepository(CoreRepository[MonitorIncident]):
    """Truy xuất sự cố giám sát."""

    model = MonitorIncident

    def get_queryset(self) -> QuerySet[MonitorIncident]:
        """Nạp trước owner và mục tiêu giám sát."""
        return super().get_queryset().select_related("owner", "target")

    def find_open_for_target(self, target_id: Any) -> MonitorIncident | None:
        """Sự cố chưa đóng của một monitor."""
        return self.filter(target_id=target_id, resolved_at__isnull=True).order_by("-started_at").first()

    def list_between(self, owner_id: Any, start_dt: datetime, end_dt: datetime) -> list[MonitorIncident]:
        """Các sự cố bắt đầu trong khoảng thời gian (cho Calendar)."""
        return list(
            self.get_queryset()
            .filter(owner_id=owner_id, started_at__gte=start_dt, started_at__lte=end_dt)
            .order_by("started_at")
        )

    def find_open_map(self, target_ids: list[Any]) -> dict[Any, MonitorIncident]:
        """Ánh xạ `{target_id: MonitorIncident}` cho mọi sự cố chưa đóng của tập target."""
        if not target_ids:
            return {}
        incidents = (
            self.get_queryset()
            .filter(target_id__in=target_ids, resolved_at__isnull=True)
            .order_by("-started_at")
        )
        mapping: dict[Any, MonitorIncident] = {}
        for inc in incidents:
            if inc.target_id not in mapping:
                mapping[inc.target_id] = inc
        return mapping
