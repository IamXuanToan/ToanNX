"""Response Chi tiết Phiên hội thoại Trợ lý AI (tối đa 50 tin gần nhất + `has_more_messages`)."""

from rest_framework import serializers

from app.workspace.models.assistant_conversation import AssistantConversation
from app.workspace.serializers.responses.assistant_message_response_serializer import (
    AssistantMessageResponseSerializer,
)


class AssistantConversationDetailResponseSerializer(serializers.ModelSerializer[AssistantConversation]):
    """Chi tiết hội thoại kèm danh sách 50 tin gần nhất theo thứ tự thời gian."""

    owner_email = serializers.CharField(source="owner.email", read_only=True, help_text="Email chủ sở hữu.")
    message_count = serializers.IntegerField(
        read_only=True, default=0, help_text="Tổng số tin nhắn trong hội thoại."
    )
    recent_messages = AssistantMessageResponseSerializer(
        many=True, read_only=True, help_text="Tối đa 50 tin nhắn gần nhất."
    )
    has_more_messages = serializers.BooleanField(
        read_only=True, default=False, help_text="Còn tin nhắn cũ hơn để phân trang qua `/messages`."
    )

    class Meta:
        model = AssistantConversation
        fields = (
            "id",
            "owner_id",
            "owner_email",
            "channel",
            "external_chat_id",
            "title",
            "last_message_at",
            "message_count",
            "recent_messages",
            "has_more_messages",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
