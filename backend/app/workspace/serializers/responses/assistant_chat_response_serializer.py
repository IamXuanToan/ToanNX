"""Response `POST /workspace/assistant/chat`."""

from typing import Any

from rest_framework import serializers

from app.workspace.serializers.responses.assistant_message_response_serializer import (
    AssistantMessageResponseSerializer,
)


class AssistantChatResponseSerializer(serializers.Serializer[Any]):
    """Phản hồi của Trợ lý AI kèm thông tin fallback/model/token."""

    conversation_id = serializers.UUIDField(help_text="ID hội thoại.")
    reply = serializers.CharField(help_text="Nội dung phản hồi văn bản của Trợ lý.")
    model_used = serializers.CharField(
        allow_blank=True, help_text="Tên model đã sử dụng (hoặc `slash` / `fallback`)."
    )
    tokens_used = serializers.IntegerField(help_text="Tổng token ghi nhận cho lượt này.")
    contains_private_data = serializers.BooleanField(help_text="Lượt này có đọc dữ liệu riêng tư.")
    is_fallback = serializers.BooleanField(
        help_text="True nếu rơi về chế độ gợi ý lệnh Slash khi LLM không khả dụng."
    )
    fallback_attempts = serializers.IntegerField(help_text="Số lượt fallback giữa các model.")
    fallback_code = serializers.CharField(
        allow_blank=True, help_text="Mã lý do fallback nếu `is_fallback=True`."
    )
    message = AssistantMessageResponseSerializer(help_text="Bản ghi AssistantMessage mới lưu.")
