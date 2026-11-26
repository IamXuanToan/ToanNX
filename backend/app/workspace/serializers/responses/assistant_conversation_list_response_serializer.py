"""Response danh sách Phiên hội thoại Trợ lý AI (gọn nhẹ, không prefetch messages)."""

from rest_framework import serializers

from app.workspace.models.assistant_conversation import AssistantConversation


class AssistantConversationListResponseSerializer(serializers.ModelSerializer[AssistantConversation]):
    """Tóm tắt hội thoại kèm số lượng tin nhắn (annotated)."""

    owner_email = serializers.CharField(source="owner.email", read_only=True, help_text="Email chủ sở hữu.")
    message_count = serializers.IntegerField(
        read_only=True, default=0, help_text="Tổng số tin nhắn trong hội thoại."
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
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
