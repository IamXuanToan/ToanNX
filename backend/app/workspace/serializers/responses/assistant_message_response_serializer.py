"""Response Tin nhắn trong hội thoại Trợ lý AI."""

from rest_framework import serializers

from app.workspace.models.assistant_message import AssistantMessage


class AssistantMessageResponseSerializer(serializers.ModelSerializer[AssistantMessage]):
    """Chi tiết từng tin nhắn kèm `model_used`, `tokens_used` và `contains_private_data`."""

    class Meta:
        model = AssistantMessage
        fields = (
            "id",
            "conversation_id",
            "role",
            "sender_telegram_id",
            "sender_name",
            "content",
            "tool_calls",
            "tool_call_id",
            "model_used",
            "tokens_used",
            "contains_private_data",
            "is_error",
            "created_at",
        )
        read_only_fields = fields
