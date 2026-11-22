"""POST /system/telegram/bot/check: kiểm tra bot Telegram của mình."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.decorators.require_permission import require_permission
from app.system.permissions.telegram_bot_permission import TelegramBotPermission
from app.system.serializers.responses.telegram_bot_check_response_serializer import (
    TelegramBotCheckResponseSerializer,
)
from app.system.services.telegram_bot_service import TelegramBotService


class TelegramBotCheckView(CoreApiView):
    """getMe + getWebhookInfo."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.telegram_bot_service = TelegramBotService()

    @extend_schema(request=None, responses=TelegramBotCheckResponseSerializer)
    @require_permission(TelegramBotPermission.READ)
    @rate_limit("system.telegram.call")
    def post(self, request: Request) -> CoreResponse:
        """Kết quả kiểm tra."""
        return CoreResponse(
            TelegramBotCheckResponseSerializer(self.telegram_bot_service.check(self.get_actor(request))).data
        )
