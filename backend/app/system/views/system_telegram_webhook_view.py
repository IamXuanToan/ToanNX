"""POST /system/telegram/webhook: nhận sự kiện từ Telegram Bot API."""

from typing import Any

from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.constants.system_rate_limit_key import SystemRateLimitKey
from app.system.services.telegram_webhook_service import TelegramWebhookService

TELEGRAM_SECRET_HEADER = "X-Telegram-Bot-Api-Secret-Token"  # noqa: S105 - tên HTTP header


class SystemTelegramWebhookView(CoreApiView):
    """Công khai không CSRF/JWT; xác thực bằng `X-Telegram-Bot-Api-Secret-Token` (sai trả 404)."""

    authentication_classes: list[Any] = []
    permission_classes: list[type[BasePermission]] = [AllowAny]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service webhook."""
        super().__init__(**kwargs)
        self.telegram_webhook_service = TelegramWebhookService()

    @extend_schema(
        request=None,
        responses={
            200: OpenApiResponse(description="Đã tiếp nhận bản tin Telegram."),
            404: OpenApiResponse(description="Sai secret token hoặc chưa cấu hình bot."),
        },
    )
    @rate_limit(SystemRateLimitKey.TELEGRAM_WEBHOOK)
    def post(self, request: Request) -> CoreResponse:
        """Nhận update Telegram, kích hoạt chat đăng ký và chuyển tiếp sang hook module."""
        payload = request.data if isinstance(request.data, dict) else {}
        result = self.telegram_webhook_service.process(
            request.headers.get(TELEGRAM_SECRET_HEADER, ""),
            payload,
        )
        return CoreResponse(result)
