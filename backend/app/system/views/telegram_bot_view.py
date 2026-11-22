"""GET/PUT/DELETE /system/telegram/bot: bot Telegram của chính mình."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.decorators.require_permission import require_permission
from app.system.permissions.telegram_bot_permission import TelegramBotPermission
from app.system.serializers.responses.telegram_bot_response_serializer import TelegramBotResponseSerializer
from app.system.serializers.validates.telegram_bot_validate_serializer import TelegramBotValidateSerializer
from app.system.services.telegram_bot_service import TelegramBotService


class TelegramBotView(CoreApiView):
    """Token chỉ ghi; đọc chỉ trả username và 4 ký tự cuối."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.telegram_bot_service = TelegramBotService()

    @extend_schema(responses=TelegramBotResponseSerializer)
    @require_permission(TelegramBotPermission.READ)
    def get(self, request: Request) -> CoreResponse:
        """Bot của mình (null nếu chưa có)."""
        bot = self.telegram_bot_service.get_for(self.get_actor(request))
        return CoreResponse(TelegramBotResponseSerializer(bot).data if bot else None)

    @extend_schema(request=TelegramBotValidateSerializer, responses=TelegramBotResponseSerializer)
    @require_permission(TelegramBotPermission.CREATE, TelegramBotPermission.UPDATE)
    @rate_limit("system.telegram.call")
    @validate_request(TelegramBotValidateSerializer)
    def put(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Kiểm token bằng getMe rồi lưu mã hóa."""
        bot = self.telegram_bot_service.save(self.get_actor(request), validated_data["token"])
        return CoreResponse(TelegramBotResponseSerializer(bot).data)

    @extend_schema(responses={204: None})
    @require_permission(TelegramBotPermission.DELETE)
    def delete(self, request: Request) -> CoreResponse:
        """Xóa bot và các nơi nhận của bot."""
        self.telegram_bot_service.delete(self.get_actor(request))
        return CoreResponse(None, status=204)
