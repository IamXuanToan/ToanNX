"""Response tạo mã đăng ký nhóm Telegram."""

from typing import Any

from rest_framework import serializers

from app.system.serializers.responses.telegram_chat_response_serializer import TelegramChatResponseSerializer


class TelegramRegistrationResponseSerializer(serializers.Serializer[Any]):
    """Mã + link thêm bot vào nhóm (`startgroup`)."""

    chat = TelegramChatResponseSerializer(help_text="Bản chờ xác minh.")
    code = serializers.CharField(help_text="Mã đăng ký (hạn 10 phút).")
    link = serializers.CharField(help_text="Link https://t.me/<bot>?startgroup=<mã>.")
