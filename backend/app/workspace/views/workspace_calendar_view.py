"""Lịch Tổng hợp 5 nguồn sự kiện (`GET /api/v1/workspace/calendar`)."""

from typing import Any

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.request import Request

from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.decorators.require_permission import require_permission
from app.workspace.permissions.workspace_calendar_permission import WorkspaceCalendarPermission
from app.workspace.serializers.responses.workspace_calendar_response_serializer import (
    WorkspaceCalendarResponseSerializer,
)
from app.workspace.serializers.validates.workspace_calendar_query_validate_serializer import (
    WorkspaceCalendarQueryValidateSerializer,
)
from app.workspace.services.workspace_calendar_service import WorkspaceCalendarService


class WorkspaceCalendarView(CoreApiView):
    """Gom lịch gia hạn dịch vụ, nhắc việc, hạn BH thiết bị, phiếu sửa & sự cố monitor."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service Lịch tổng hợp."""
        super().__init__(**kwargs)
        self.calendar_service = WorkspaceCalendarService()

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="from",
                type=str,
                location=OpenApiParameter.QUERY,
                required=True,
                description="Ngày bắt đầu (YYYY-MM-DD).",
            ),
            OpenApiParameter(
                name="to",
                type=str,
                location=OpenApiParameter.QUERY,
                required=True,
                description="Ngày kết thúc (YYYY-MM-DD, tối đa +93 ngày).",
            ),
            OpenApiParameter(
                name="types",
                type=str,
                location=OpenApiParameter.QUERY,
                required=False,
                description="Các loại sự kiện phân tách dấu phẩy.",
            ),
            OpenApiParameter(
                name="owner",
                type=str,
                location=OpenApiParameter.QUERY,
                required=False,
                description="UUID chủ sở hữu (chỉ áp dụng khi có quyền manage_all).",
            ),
        ],
        responses=WorkspaceCalendarResponseSerializer,
    )
    @require_permission(WorkspaceCalendarPermission.READ)
    def get(self, request: Request) -> CoreResponse:
        """Lấy toàn bộ sự kiện trong khoảng ngày theo múi giờ cài đặt của user."""
        raw_types = request.query_params.getlist("types")
        parsed_types = [t.strip() for item in raw_types for t in item.split(",") if t.strip()]
        params = WorkspaceCalendarQueryValidateSerializer.validate_data(
            {
                "start_date": request.query_params.get("from"),
                "end_date": request.query_params.get("to"),
                "types": parsed_types,
                "owner": request.query_params.get("owner") or None,
            }
        )
        data = self.calendar_service.events(
            self.get_actor(request),
            from_date=params["start_date"],
            to_date=params["end_date"],
            types=params.get("types") or None,
            target_owner_id=params.get("owner"),
        )
        return CoreResponse(WorkspaceCalendarResponseSerializer(data).data)
