"""Repository Mục tiêu giám sát Uptime/HTTP."""

from typing import Any

from django.db.models import QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.workspace.models.monitor_target import MonitorTarget


class MonitorTargetRepository(CoreRepository[MonitorTarget]):
    """Truy xuất danh sách monitor endpoint và đồng bộ snapshot cho Redis W1."""

    model = MonitorTarget

    def get_queryset(self) -> QuerySet[MonitorTarget]:
        """Nạp trước owner."""
        return super().get_queryset().select_related("owner")

    def list_active_targets(self) -> list[MonitorTarget]:
        """Danh sách tất cả monitor đang bật để nạp lại cache W1 hoặc fallback DB."""
        return list(self.get_queryset().filter(is_active=True).order_by("last_checked_at", "created_at"))

    def list_for_owner(self, owner_id: Any, *, limit: int = 15) -> tuple[list[MonitorTarget], int]:
        """Danh sách monitor của owner cho AI tool / trạng thái tổng quan."""
        qs = self.get_queryset().filter(owner_id=owner_id).order_by("last_status", "name")
        return list(qs[:limit]), qs.count()

    def bulk_update_states(self, targets: list[MonitorTarget]) -> None:
        """Lưu hàng loạt kết quả ping gần nhất xuống DB."""
        if not targets:
            return
        self.model.objects.bulk_update(
            targets,
            [
                "last_status",
                "last_status_code",
                "last_latency_ms",
                "last_checked_at",
                "consecutive_failures",
                "updated_at",
            ],
        )

    def list_by_ids(self, target_ids: list[Any]) -> dict[str, MonitorTarget]:
        """Nạp bản ghi MonitorTarget theo tập ID kèm owner."""
        if not target_ids:
            return {}
        items = self.get_queryset().filter(id__in=target_ids)
        return {str(item.pk): item for item in items}
