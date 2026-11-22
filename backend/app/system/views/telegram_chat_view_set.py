"""Nhóm Telegram nhận thông báo."""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.system.models.telegram_chat import TelegramChat
from app.system.permissions.telegram_chat_permission import TelegramChatPermission as P
from app.system.serializers.responses.telegram_chat_response_serializer import TelegramChatResponseSerializer
from app.system.serializers.validates.telegram_chat_update_validate_serializer import (
    TelegramChatUpdateValidateSerializer,
)
from app.system.services.telegram_chat_service import TelegramChatService
from app.system.types.permission_rule import permission_rule


class TelegramChatViewSet(CoreModelViewSet[TelegramChat]):
    """Nhóm Telegram nhận thông báo."""

    service_class = TelegramChatService
    ordering = ("-created_at",)
    ordering_fields = ("created_at",)
    list_serializer_class = TelegramChatResponseSerializer
    detail_serializer_class = TelegramChatResponseSerializer
    update_serializer_class = TelegramChatUpdateValidateSerializer
    http_method_names = ["get", "patch", "delete", "head", "options"]
    action_permissions = {
        "list": permission_rule(P.READ),
        "retrieve": permission_rule(P.READ),
        "partial_update": permission_rule(P.UPDATE),
        "destroy": permission_rule(P.DELETE),
    }
