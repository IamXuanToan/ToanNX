"""GET /system/telegram/bot: thông tin Bot Telegram dùng chung cho mọi thành viên đã đăng nhập."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import BasePermission
from rest_framework.request import Request

from app.core.permissions.is_active_authenticated import IsActiveAuthenticated
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.serializers.responses.telegram_bot_response_serializer import TelegramBotResponseSerializer
from app.system.services.telegram_bot_service import TelegramBotService


class TelegramBotView(CoreApiView):
    """Chỉ trả metadata an toàn (`configured`, `username`, `display_name`, `bot_url`), không trả token."""

    permission_classes: list[type[BasePermission]] = [IsActiveAuthenticated]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.telegram_bot_service = TelegramBotService()

    @extend_schema(responses=TelegramBotResponseSerializer)
    def get(self, request: Request) -> CoreResponse:
        """Thông tin Bot Telegram chung của hệ thống."""
        info = self.telegram_bot_service.bot_info()
        return CoreResponse(TelegramBotResponseSerializer(info).data)
