"""Validate câu hỏi / lệnh gửi tới Trợ lý AI (`POST /workspace/assistant/chat`)."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.workspace.constants.workspace_defaults import AI_MESSAGE_MAX_LENGTH


class AssistantChatValidateSerializer(CoreValidateSerializer):
    """Đầu vào trò chuyện Trợ lý AI Web Portal."""

    message = serializers.CharField(
        min_length=1,
        max_length=AI_MESSAGE_MAX_LENGTH,
        help_text="Câu hỏi tự nhiên hoặc lệnh Slash bắt đầu bằng `/` (tối đa 2000 ký tự).",
    )
    conversation_id = serializers.UUIDField(
        required=False,
        allow_null=True,
        default=None,
        help_text="ID phiên hội thoại muốn tiếp tục (bỏ trống để dùng phiên gần nhất hoặc tạo mới).",
    )
