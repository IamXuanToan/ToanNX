"""Validate câu hỏi / lệnh gửi tới Trợ lý AI 1 luồng (`POST /workspace/assistant/chat`)."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.workspace.constants.workspace_defaults import AI_MESSAGE_MAX_LENGTH


class AssistantChatValidateSerializer(CoreValidateSerializer):
    """Đầu vào trò chuyện Trợ lý AI Web Portal (luôn gắn 1 luồng duy nhất của user)."""

    message = serializers.CharField(
        min_length=1,
        max_length=AI_MESSAGE_MAX_LENGTH,
        help_text="Câu hỏi tự nhiên hoặc lệnh Slash bắt đầu bằng `/` (tối đa 2000 ký tự).",
    )
