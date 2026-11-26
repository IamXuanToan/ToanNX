"""CRUD Mục tiêu giám sát Uptime/HTTP (`/api/v1/workspace/monitor-targets` + `/ping`)."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from app.core.responses.core_response import CoreResponse
from app.core.views.core_model_view_set import CoreModelViewSet
from app.system.types.permission_rule import permission_rule
from app.workspace.constants.workspace_rate_limit_key import WorkspaceRateLimitKey
from app.workspace.filters.monitor_target_filter import MonitorTargetFilter
from app.workspace.models.monitor_target import MonitorTarget
from app.workspace.permissions.monitor_target_permission import MonitorTargetPermission as P
from app.workspace.serializers.responses.monitor_target_ping_response_serializer import (
    MonitorTargetPingResponseSerializer,
)
from app.workspace.serializers.responses.monitor_target_response_serializer import (
    MonitorTargetResponseSerializer,
)
from app.workspace.serializers.validates.monitor_target_bulk_update_validate_serializer import (
    MonitorTargetBulkUpdateValidateSerializer,
)
from app.workspace.serializers.validates.monitor_target_create_validate_serializer import (
    MonitorTargetCreateValidateSerializer,
)
from app.workspace.serializers.validates.monitor_target_update_validate_serializer import (
    MonitorTargetUpdateValidateSerializer,
)
from app.workspace.services.monitor_target_service import MonitorTargetService


class MonitorTargetViewSet(CoreModelViewSet[MonitorTarget]):
    """Quản lý endpoint Uptime; tự trộn trạng thái realtime từ Redis nếu mới hơn DB."""

    service_class = MonitorTargetService
    filterset_class = MonitorTargetFilter
    search_fields = ("name", "url")
    ordering_fields = ("last_checked_at", "last_latency_ms", "created_at")
    ordering = ("-created_at", "-pk")
    list_serializer_class = MonitorTargetResponseSerializer
    detail_serializer_class = MonitorTargetResponseSerializer
    create_serializer_class = MonitorTargetCreateValidateSerializer
    update_serializer_class = MonitorTargetUpdateValidateSerializer
    bulk_update_serializer_class = MonitorTargetBulkUpdateValidateSerializer
    bulk_delete_enabled = True
    history_enabled = True
    action_rate_limits = {
        "create": WorkspaceRateLimitKey.MONITOR_CREATE,
        "ping": WorkspaceRateLimitKey.MONITOR_PING,
    }
    action_permissions = {
        "list": permission_rule(P.READ),
        "retrieve": permission_rule(P.READ),
        "create": permission_rule(P.CREATE),
        "partial_update": permission_rule(P.UPDATE),
        "destroy": permission_rule(P.DELETE),
        "bulk_update": permission_rule(P.UPDATE),
        "bulk_delete": permission_rule(P.DELETE),
        "history": permission_rule(P.READ),
        "ping": permission_rule(P.UPDATE),
    }

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo MonitorTargetService."""
        super().__init__(**kwargs)
        self.monitor_service = MonitorTargetService()

    def list(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Trộn trạng thái mới hơn từ Redis cho từng trang trước khi serialize."""
        qs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(qs)
        if page is None:
            items = [self.monitor_service.overlay_redis_state(obj) for obj in qs]
            return CoreResponse(
                self.list_serializer_class(items, many=True, context=self.get_serializer_context()).data
            )
        overlaid = [self.monitor_service.overlay_redis_state(obj) for obj in page]
        return self.get_paginated_response(
            self.list_serializer_class(overlaid, many=True, context=self.get_serializer_context()).data
        )

    def retrieve(self, request: Request, *args: Any, **kwargs: Any) -> CoreResponse:
        """Chi tiết endpoint đã trộn trạng thái mới hơn từ Redis."""
        instance = self.monitor_service.overlay_redis_state(self.get_object_for_actor(kwargs["pk"]))
        return CoreResponse(self.serialize_detail(instance))

    @extend_schema(request=None, responses=MonitorTargetPingResponseSerializer)
    @action(detail=True, methods=["post"])
    def ping(self, request: Request, pk: Any = None) -> CoreResponse:
        """Ping kiểm tra thủ công URL qua SafeHttpClient (timeout <= 5s)."""
        data = self.monitor_service.ping(self.get_actor(request), pk)
        return CoreResponse(MonitorTargetPingResponseSerializer(data).data)
