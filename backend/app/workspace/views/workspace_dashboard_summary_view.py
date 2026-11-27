"""Tổng quan KPI Dashboard Portal (`GET /api/v1/workspace/dashboard/summary`)."""

from typing import Any

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.request import Request

from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.decorators.require_permission import require_permission
from app.workspace.permissions.workspace_dashboard_permission import WorkspaceDashboardPermission
from app.workspace.serializers.responses.workspace_dashboard_summary_response_serializer import (
    WorkspaceDashboardSummaryResponseSerializer,
)
from app.workspace.services.workspace_dashboard_service import WorkspaceDashboardService


class WorkspaceDashboardSummaryView(CoreApiView):
    """Trả 4 KPI tổng hợp theo owner (hoặc theo `?owner=` nếu có `manage_all`)."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service tổng hợp dashboard."""
        super().__init__(**kwargs)
        self.dashboard_service = WorkspaceDashboardService()

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="owner",
                type=str,
                location=OpenApiParameter.QUERY,
                required=False,
                description="UUID chủ sở hữu (chỉ có hiệu lực khi có quyền manage_all).",
            )
        ],
        responses=WorkspaceDashboardSummaryResponseSerializer,
    )
    @require_permission(WorkspaceDashboardPermission.READ)
    def get(self, request: Request) -> CoreResponse:
        """Tổng hợp số liệu chi tiêu tháng, nhắc việc hôm nay, bảo hành & monitor."""
        target_owner = request.query_params.get("owner") or None
        data = self.dashboard_service.summary(self.get_actor(request), target_owner_id=target_owner)
        return CoreResponse(WorkspaceDashboardSummaryResponseSerializer(data).data)
