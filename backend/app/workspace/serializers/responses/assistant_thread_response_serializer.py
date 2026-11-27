"""Response 1 luồng chat Web duy nhất (`GET /workspace/assistant/thread`)."""

from typing import Any

from rest_framework import serializers

from app.workspace.serializers.responses.assistant_message_response_serializer import (
    AssistantMessageResponseSerializer,
)


class AssistantThreadResponseSerializer(serializers.Serializer[Any]):
    """Danh sách tin nhắn theo thứ tự thời gian kèm cờ còn tin cũ hơn."""

    messages = AssistantMessageResponseSerializer(many=True, help_text="Tin nhắn gần nhất.")
    has_more_messages = serializers.BooleanField(help_text="Còn tin cũ hơn để tải thêm.")
    total_messages = serializers.IntegerField(help_text="Tổng số tin nhắn trong luồng.")
