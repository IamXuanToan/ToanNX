"""Sửa nhóm Telegram."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.system.models.telegram_chat import TelegramChat


class TelegramChatUpdateValidateSerializer(CoreValidateSerializer):
    """Bật/tắt và cấu hình chế độ phản hồi nhóm Telegram."""

    is_active = serializers.BooleanField(required=False, help_text="Đang bật.")
    group_reply_mode = serializers.ChoiceField(
        choices=TelegramChat.GroupReplyMode.choices,
        required=False,
        help_text="Chế độ phản hồi AI trong nhóm (`mention_only` hoặc `all_messages`).",
    )
