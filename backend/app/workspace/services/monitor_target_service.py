"""Nghiệp vụ Giám sát Uptime/HTTP: kiểm SSRF lúc lưu, ping an toàn & đồng bộ Redis/sự cố."""

from datetime import datetime
from typing import Any

from django.db import transaction
from django.utils import timezone

from app.core.exceptions.validation_error import ValidationError
from app.core.services.core_crud_service import CoreCrudService
from app.core.utils.safe_http_client import SafeHttpClient, validate_url_safety
from app.system.services.notification_service import NotificationService
from app.system.types.notification_payload import NotificationPayload
from app.workspace.constants.workspace_defaults import (
    AI_TOOL_ITEM_LIMIT,
    MONITOR_MAX_TIMEOUT_SECONDS,
    MONITOR_MIN_INTERVAL_MINUTES,
)
from app.workspace.constants.workspace_error_code import WorkspaceErrorCode
from app.workspace.constants.workspace_notification_event import WorkspaceNotificationEvent
from app.workspace.models.monitor_incident import MonitorIncident
from app.workspace.models.monitor_target import MonitorTarget
from app.workspace.permissions.monitor_target_permission import MonitorTargetPermission
from app.workspace.repositories.monitor_incident_repository import MonitorIncidentRepository
from app.workspace.repositories.monitor_target_repository import MonitorTargetRepository
from app.workspace.services.workspace_alerts_cache_service import WorkspaceAlertsCacheService

PORTAL_MONITORS_PATH = "/ca-nhan/uptime"


class MonitorTargetService(CoreCrudService[MonitorTarget, MonitorTargetRepository]):
    """Quản lý endpoint giám sát, đồng bộ cache Redis W1 và phát cảnh báo DOWN/RECOVERED."""

    repository_class = MonitorTargetRepository
    owner_field = "owner"
    manage_all_permission = MonitorTargetPermission.MANAGE_ALL.code

    def __init__(
        self,
        repository: MonitorTargetRepository | None = None,
        incident_repository: MonitorIncidentRepository | None = None,
        alerts_cache_service: WorkspaceAlertsCacheService | None = None,
        notification_service: NotificationService | None = None,
    ) -> None:
        """Khởi tạo repository monitor, incident, cache W1 và notification service."""
        super().__init__(repository or MonitorTargetRepository())
        self.incident_repository = incident_repository or MonitorIncidentRepository()
        self.alerts_cache_service = alerts_cache_service or WorkspaceAlertsCacheService()
        self.notification_service = notification_service or NotificationService()

    @transaction.atomic
    def create(self, actor: Any, data: dict[str, Any]) -> MonitorTarget:
        """Kiểm SSRF trước khi lưu target mới và đồng bộ danh sách vào Redis."""
        payload = dict(data)
        payload["url"] = self._validate_target_url(payload["url"])
        payload["timeout_seconds"] = max(
            1, min(int(payload.get("timeout_seconds", 4)), MONITOR_MAX_TIMEOUT_SECONDS)
        )
        payload["check_interval_minutes"] = max(
            MONITOR_MIN_INTERVAL_MINUTES, int(payload.get("check_interval_minutes", 30))
        )
        target = super().create(actor, payload)
        self.alerts_cache_service.sync_monitors_active_on_commit()
        return target

    @transaction.atomic
    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> MonitorTarget:
        """Cập nhật target, kiểm SSRF nếu đổi URL và đồng bộ lại Redis W1."""
        target = self.get_for_write(actor, pk)
        payload = dict(data)
        if "url" in payload:
            payload["url"] = self._validate_target_url(payload["url"])
        if "timeout_seconds" in payload:
            payload["timeout_seconds"] = max(
                1, min(int(payload["timeout_seconds"]), MONITOR_MAX_TIMEOUT_SECONDS)
            )
        if "check_interval_minutes" in payload:
            payload["check_interval_minutes"] = max(
                MONITOR_MIN_INTERVAL_MINUTES, int(payload["check_interval_minutes"])
            )
        updated = self.repository.update(target, actor=actor, **payload)
        self.alerts_cache_service.sync_monitors_active_on_commit()
        return updated

    @transaction.atomic
    def delete(self, actor: Any, pk: Any) -> None:
        """Xóa mềm target và đồng bộ danh sách Redis W1."""
        super().delete(actor, pk)
        self.alerts_cache_service.sync_monitors_active_on_commit()

    def ping(self, actor: Any, pk: Any) -> dict[str, Any]:
        """Ping thủ công một endpoint (không giữ khóa dòng DB khi đợi HTTP)."""
        target = self.get_by_id_for(actor, pk)
        probe_result = SafeHttpClient().probe(
            target.url,
            method=target.method,
            timeout=float(target.timeout_seconds),
        )
        checked_at = timezone.now()
        with transaction.atomic():
            locked = self.get_for_write(actor, pk)
            updated, incident = self.apply_probe_result(
                locked,
                probe_result,
                checked_at=checked_at,
                actor=actor,
                kick=True,
            )
            self.alerts_cache_service.write_monitor_state(
                updated.pk,
                {
                    "last_status": updated.last_status,
                    "last_status_code": updated.last_status_code,
                    "last_latency_ms": updated.last_latency_ms,
                    "last_checked_at": checked_at.isoformat(),
                    "consecutive_failures": updated.consecutive_failures,
                    "last_db_flush_at": checked_at.isoformat(),
                },
            )
            self.alerts_cache_service.sync_monitors_active_on_commit()

        return {
            "target_id": str(updated.pk),
            "status": updated.last_status,
            "status_code": updated.last_status_code,
            "latency_ms": updated.last_latency_ms,
            "checked_at": checked_at,
            "error_message": str(probe_result.get("error_message") or ""),
            "incident_id": str(incident.pk) if incident else None,
        }

    def is_probe_healthy(self, expected_status: int, probe_result: dict[str, Any]) -> bool:
        """Đánh giá HTTP status nhận về có đạt kỳ vọng hay không."""
        if not probe_result.get("ok"):
            return False
        code = probe_result.get("status_code")
        if code is None:
            return False
        code_int = int(code)
        if expected_status == 200:
            return 200 <= code_int < 400
        return code_int == expected_status

    def apply_probe_result(
        self,
        target: MonitorTarget,
        probe_result: dict[str, Any],
        *,
        checked_at: datetime,
        actor: Any | None = None,
        open_incident: MonitorIncident | None = None,
        kick: bool = True,
    ) -> tuple[MonitorTarget, MonitorIncident | None]:
        """Ghi nhận kết quả ping xuống DB, mở/đóng `MonitorIncident` và gửi thông báo khi đổi trạng thái."""
        previous_status = target.last_status
        healthy = self.is_probe_healthy(target.expected_status, probe_result)
        new_status = MonitorTarget.Status.HEALTHY if healthy else MonitorTarget.Status.DOWN
        new_failures = 0 if healthy else int(target.consecutive_failures) + 1
        status_code = probe_result.get("status_code")
        latency_ms = probe_result.get("latency_ms")

        updated = self.repository.update(
            target,
            actor=actor,
            last_status=new_status,
            last_status_code=status_code,
            last_latency_ms=latency_ms,
            last_checked_at=checked_at,
            consecutive_failures=new_failures,
        )

        incident: MonitorIncident | None = open_incident
        if new_status == MonitorTarget.Status.DOWN and previous_status != MonitorTarget.Status.DOWN:
            error_msg = str(probe_result.get("error_message") or "")
            if not error_msg and status_code is not None:
                error_msg = f"HTTP {status_code} (kỳ vọng {target.expected_status})"
            if incident is None:
                incident = self.incident_repository.find_open_for_target(updated.pk)
            if incident is None:
                incident = self.incident_repository.create(
                    owner=updated.owner,
                    target=updated,
                    started_at=checked_at,
                    status_code=status_code,
                    error_message=error_msg,
                )
            self.notification_service.notify(
                WorkspaceNotificationEvent.MONITOR_DOWN,
                dedup_key=f"monitor-down:{updated.pk}:{incident.pk}",
                recipient=updated.owner,
                payload=NotificationPayload(
                    title=f"{updated.name} ngừng phản hồi",
                    body=error_msg or f"Endpoint {updated.url} gặp sự cố.",
                    link=PORTAL_MONITORS_PATH,
                    message_key="workspace.notifications.monitorDown",
                    params={"name": updated.name, "error": error_msg},
                    details=(
                        ("🌐 Dịch vụ", updated.name),
                        ("🔗 URL", updated.url),
                        ("⚠️ Lỗi", error_msg or "-"),
                    ),
                ),
                kick=kick,
            )
        elif new_status == MonitorTarget.Status.HEALTHY and previous_status == MonitorTarget.Status.DOWN:
            if incident is None:
                incident = self.incident_repository.find_open_for_target(updated.pk)
            duration_seconds = 0
            if incident is not None:
                duration_seconds = max(0, int((checked_at - incident.started_at).total_seconds()))
                incident = self.incident_repository.update(
                    incident,
                    resolved_at=checked_at,
                    duration_seconds=duration_seconds,
                )
            inc_id = incident.pk if incident else checked_at.isoformat()
            self.notification_service.notify(
                WorkspaceNotificationEvent.MONITOR_RECOVERED,
                dedup_key=f"monitor-up:{updated.pk}:{inc_id}",
                recipient=updated.owner,
                payload=NotificationPayload(
                    title=f"{updated.name} đã phục hồi",
                    body=f"Endpoint hoạt động trở lại (gián đoạn {duration_seconds}s).",
                    link=PORTAL_MONITORS_PATH,
                    message_key="workspace.notifications.monitorRecovered",
                    params={"name": updated.name, "duration_seconds": duration_seconds},
                    details=(
                        ("🌐 Dịch vụ", updated.name),
                        ("⏱️ Thời gian phản hồi", f"{latency_ms or 0} ms"),
                        ("⌛ Gián đoạn", f"{duration_seconds} giây"),
                    ),
                ),
                kick=kick,
            )

        return updated, incident

    def overlay_redis_state(self, target: MonitorTarget) -> MonitorTarget:
        """Trộn trạng thái mới hơn từ Redis `monitor_state` lên bản ghi trước khi serialize."""
        cached = self.alerts_cache_service.read_monitor_state(target.pk)
        if not cached:
            return target
        cached_at_raw = cached.get("last_checked_at")
        if not isinstance(cached_at_raw, str):
            return target
        try:
            cached_at = datetime.fromisoformat(cached_at_raw)
        except ValueError:
            return target
        if target.last_checked_at is None or cached_at > target.last_checked_at:
            target.last_status = str(cached.get("last_status") or target.last_status)
            target.last_status_code = cached.get("last_status_code")
            target.last_latency_ms = cached.get("last_latency_ms")
            target.last_checked_at = cached_at
            target.consecutive_failures = int(cached.get("consecutive_failures") or 0)
        return target

    def get_realtime_status(self, actor: Any) -> tuple[list[MonitorTarget], int]:
        """Lấy trạng thái monitor cho AI Tool (lọc `owner_id=actor.pk` và trộn Redis)."""
        items, total = self.repository.list_for_owner(actor.pk, limit=AI_TOOL_ITEM_LIMIT)
        return [self.overlay_redis_state(item) for item in items], total

    def _validate_target_url(self, url: str) -> str:
        try:
            return validate_url_safety(url.strip())
        except ValidationError as exc:
            details = getattr(exc, "details", None) or {"url": ["URL không an toàn."]}
            raise ValidationError(
                "URL giám sát không an toàn hoặc trỏ vào mạng nội bộ.",
                code=WorkspaceErrorCode.MONITOR_URL_UNSAFE,
                details=details if isinstance(details, dict) else {"url": ["URL không an toàn."]},
            ) from exc
