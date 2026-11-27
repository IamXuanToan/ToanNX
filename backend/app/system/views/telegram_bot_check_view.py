"""POST /system/telegram/bot/check: kiểm tra và đồng bộ webhook Bot Telegram chung."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.responses.core_response import CoreResponse
from app.core.utils.url import build_backend_url
from app.core.views.core_api_view import CoreApiView
from app.system.constants.system_rate_limit_key import SystemRateLimitKey
from app.system.decorators.require_permission import require_permission
from app.system.permissions.setting_permission import SettingPermission
from app.system.serializers.responses.telegram_bot_check_response_serializer import (
    TelegramBotCheckResponseSerializer,
)
from app.system.services.telegram_bot_service import TelegramBotService


class TelegramBotCheckView(CoreApiView):
    """Chỉ quản trị có quyền `system.setting.update`: getMe + setWebhook + getWebhookInfo."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.telegram_bot_service = TelegramBotService()

    @extend_schema(request=None, responses=TelegramBotCheckResponseSerializer)
    @require_permission(SettingPermission.SETTING_UPDATE)
    @rate_limit(SystemRateLimitKey.TELEGRAM_CALL)
    def post(self, request: Request) -> CoreResponse:
        """Kiểm tra token và đồng bộ webhook Bot Telegram chung."""
        webhook_url = build_backend_url("/api/v1/system/telegram/webhook")
        result = self.telegram_bot_service.check(webhook_url)
        return CoreResponse(TelegramBotCheckResponseSerializer(result).data)
