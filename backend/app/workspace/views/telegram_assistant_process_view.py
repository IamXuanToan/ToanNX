"""Xử lý Trợ lý AI Telegram bất đồng bộ 1-hop từ QStash (`POST /workspace/assistant/telegram-process`)."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.workspace.constants.workspace_rate_limit_key import WorkspaceRateLimitKey
from app.workspace.serializers.responses.telegram_async_process_response_serializer import (
    TelegramAsyncProcessResponseSerializer,
)
from app.workspace.services.telegram_assistant_router_service import TelegramAssistantRouterService
from app.workspace.services.workspace_cron_service import WorkspaceCronService


class TelegramAssistantProcessView(CoreApiView):
    """Nhận update đã đẩy từ webhook qua QStash (`Upstash-Signature` hoặc `CRON_SECRET`), chạy xKiro."""

    authentication_classes: list[Any] = []
    permission_classes: list[type[BasePermission]] = [AllowAny]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service xác thực và router xử lý Telegram AI."""
        super().__init__(**kwargs)
        self.cron_service = WorkspaceCronService()
        self.router_service = TelegramAssistantRouterService()

    @extend_schema(request=None, responses=TelegramAsyncProcessResponseSerializer)
    @rate_limit(WorkspaceRateLimitKey.TELEGRAM_PROCESS)
    def post(self, request: Request) -> CoreResponse:
        """Xác thực QStash/CRON_SECRET rồi chạy xKiro + gửi phản hồi về Telegram."""
        self.cron_service.authorize_request(request.headers, request.body, request.path)
        raw_update = request.data.get("update") if isinstance(request.data, dict) else None
        if not isinstance(raw_update, dict):
            return CoreResponse(
                TelegramAsyncProcessResponseSerializer(
                    {"handled": False, "queued": False, "replied_in_dm": False, "reason": "missing_update"}
                ).data
            )
        result = self.router_service.process_async_update(raw_update)
        return CoreResponse(TelegramAsyncProcessResponseSerializer(result).data)
