"""QStash Dispatch Due (`POST /api/v1/workspace/cron/dispatch-due`): phát Digest & Reminder đúng phút."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.workspace.constants.workspace_rate_limit_key import WorkspaceRateLimitKey
from app.workspace.serializers.responses.workspace_cron_tick_response_serializer import (
    WorkspaceCronTickResponseSerializer,
)
from app.workspace.services.workspace_cron_service import WorkspaceCronService


class WorkspaceCronDispatchDueView(CoreApiView):
    """Endpoint nhận lịch hẹn QStash 7 ngày (hoặc CRON_SECRET), chỉ chạy đường W4."""

    authentication_classes: list[Any] = []
    permission_classes: list[type[BasePermission]] = [AllowAny]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo WorkspaceCronService."""
        super().__init__(**kwargs)
        self.cron_service = WorkspaceCronService()

    @extend_schema(request=None, responses=WorkspaceCronTickResponseSerializer)
    @rate_limit(WorkspaceRateLimitKey.CRON_DISPATCH_DUE)
    def post(self, request: Request) -> CoreResponse:
        """Thực thi W4 kiểm tra & gửi thông báo tới hạn kèm chống gửi trùng."""
        self.cron_service.authorize_request(request.headers, request.body, request.path)
        result = self.cron_service.run_tick(run_w1=False, run_w4=True, force_w4=True)
        return CoreResponse(WorkspaceCronTickResponseSerializer(result).data)
