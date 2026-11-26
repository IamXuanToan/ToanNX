"""Cron Tick Serverless (`POST /api/v1/workspace/cron/tick`): chạy W1 (Monitor) + W4 (Alerts)."""

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


class WorkspaceCronTickView(CoreApiView):
    """Xác thực `CRON_SECRET`/`Upstash-Signature`; W1/W4 bỏ qua sớm khi Redis chưa tới hạn."""

    authentication_classes: list[Any] = []
    permission_classes: list[type[BasePermission]] = [AllowAny]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo WorkspaceCronService."""
        super().__init__(**kwargs)
        self.cron_service = WorkspaceCronService()

    @extend_schema(request=None, responses=WorkspaceCronTickResponseSerializer)
    @rate_limit(WorkspaceRateLimitKey.CRON_TICK)
    def post(self, request: Request) -> CoreResponse:
        """Thực thi 1 nhịp W1 + W4."""
        self.cron_service.authorize_request(request.headers, request.body, request.path)
        result = self.cron_service.run_tick(run_w1=True, run_w4=True, force_w4=False)
        return CoreResponse(WorkspaceCronTickResponseSerializer(result).data)
