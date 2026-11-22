"""POST /system/telegram-chats/register (tạo mã) · POST /system/telegram-chats/{id}/{verify|test}."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.decorators.validate_request import validate_request
from app.core.exceptions.not_found_error import NotFoundError
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.decorators.require_permission import require_permission
from app.system.permissions.telegram_chat_permission import TelegramChatPermission
from app.system.serializers.responses.telegram_chat_response_serializer import TelegramChatResponseSerializer
from app.system.serializers.responses.telegram_registration_response_serializer import (
    TelegramRegistrationResponseSerializer,
)
from app.system.serializers.validates.telegram_registration_validate_serializer import (
    TelegramRegistrationValidateSerializer,
)
from app.system.services.telegram_chat_service import TelegramChatService

ACTIONS = ("verify", "test")


class TelegramChatActionView(CoreApiView):
    """Tạo mã đăng ký với bot riêng của người dùng."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.telegram_chat_service = TelegramChatService()

    @extend_schema(
        request=TelegramRegistrationValidateSerializer, responses=TelegramRegistrationResponseSerializer
    )
    @require_permission(TelegramChatPermission.CREATE)
    @rate_limit("system.telegram.call")
    @validate_request(TelegramRegistrationValidateSerializer)
    def post(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Mã + link."""
        data = self.telegram_chat_service.start_registration(self.get_actor(request), validated_data["kind"])
        return CoreResponse(TelegramRegistrationResponseSerializer(data).data, status=201)


class TelegramChatActionObjectView(CoreApiView):
    """Xác minh hoặc gửi thử."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.telegram_chat_service = TelegramChatService()

    @extend_schema(request=None, responses=TelegramChatResponseSerializer)
    @require_permission(TelegramChatPermission.UPDATE, TelegramChatPermission.CREATE)
    @rate_limit("system.telegram.call")
    def post(self, request: Request, pk: Any, action: str) -> CoreResponse:
        """`verify` hoặc `test`."""
        if action not in ACTIONS:
            raise NotFoundError()
        actor = self.get_actor(request)
        chat = (
            self.telegram_chat_service.verify(actor, pk)
            if action == "verify"
            else self.telegram_chat_service.send_test(actor, pk)
        )
        return CoreResponse(TelegramChatResponseSerializer(chat).data)
