"""Sự cố giám sát Uptime/HTTP (`/api/v1/workspace/monitor-incidents`, chỉ đọc & xóa)."""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.system.types.permission_rule import DENY, permission_rule
from app.workspace.filters.monitor_incident_filter import MonitorIncidentFilter
from app.workspace.models.monitor_incident import MonitorIncident
from app.workspace.permissions.monitor_incident_permission import MonitorIncidentPermission as P
from app.workspace.serializers.responses.monitor_incident_response_serializer import (
    MonitorIncidentResponseSerializer,
)
from app.workspace.services.monitor_incident_service import MonitorIncidentService


class MonitorIncidentViewSet(CoreModelViewSet[MonitorIncident]):
    """Tra cứu và xóa lịch sử sự cố downtime."""

    service_class = MonitorIncidentService
    filterset_class = MonitorIncidentFilter
    search_fields = ("target__name", "error_message")
    ordering_fields = ("started_at", "duration_seconds", "created_at")
    ordering = ("-started_at", "-created_at", "-pk")
    list_serializer_class = MonitorIncidentResponseSerializer
    detail_serializer_class = MonitorIncidentResponseSerializer
    http_method_names = ["get", "post", "delete", "head", "options"]
    bulk_delete_enabled = True
    history_enabled = False
    action_permissions = {
        "list": permission_rule(P.READ),
        "retrieve": permission_rule(P.READ),
        "create": DENY,
        "destroy": permission_rule(P.DELETE),
        "bulk_delete": permission_rule(P.DELETE),
    }
