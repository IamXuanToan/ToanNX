"""Response Tin nhắn trong hội thoại Trợ lý AI."""

from typing import Any

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from app.workspace.models.assistant_message import AssistantMessage
from app.workspace.serializers.responses.assistant_quick_input_response_serializer import (
    AssistantQuickInputResponseSerializer,
)
from app.workspace.serializers.responses.assistant_quick_reply_response_serializer import (
    AssistantQuickReplyResponseSerializer,
)
from app.workspace.serializers.responses.assistant_result_card_response_serializer import (
    AssistantResultCardResponseSerializer,
)
from app.workspace.services.assistant_result_card_builder import AssistantResultCardBuilder

# Chỉ xử lý chuỗi (không chạm DB): dùng chung một instance.
_CARD_BUILDER = AssistantResultCardBuilder()


class AssistantMessageResponseSerializer(serializers.ModelSerializer[AssistantMessage]):
    """Chi tiết tin nhắn kèm model/token/cờ riêng tư, nút trả lời nhanh và thẻ kết quả."""

    quick_replies = serializers.SerializerMethodField(help_text="Nút trả lời nhanh cho lựa chọn đang hỏi.")
    quick_input = serializers.SerializerMethodField(
        help_text="Ô nhập trực tiếp cho câu hỏi đang chờ (số kèm đơn vị, chữ, mật khẩu); null nếu không có."
    )
    cards = serializers.SerializerMethodField(help_text="Thẻ kết quả do server dựng từ dữ liệu thật.")

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
            "quick_replies",
            "quick_input",
            "cards",
            "created_at",
        )
        read_only_fields = fields

    @extend_schema_field(AssistantQuickReplyResponseSerializer(many=True))
    def get_quick_replies(self, obj: AssistantMessage) -> list[dict[str, Any]]:
        """Danh sách `{caption, text}` lưu trong `metadata.quick_replies`."""
        metadata = obj.metadata if isinstance(obj.metadata, dict) else {}
        items = metadata.get("quick_replies")
        return [item for item in items if isinstance(item, dict)] if isinstance(items, list) else []

    @extend_schema_field(AssistantQuickInputResponseSerializer(allow_null=True))
    def get_quick_input(self, obj: AssistantMessage) -> dict[str, Any] | None:
        """`metadata.quick_input` nếu câu hỏi cho phép gõ giá trị trực tiếp."""
        metadata = obj.metadata if isinstance(obj.metadata, dict) else {}
        value = metadata.get("quick_input")
        return value if isinstance(value, dict) else None

    @extend_schema_field(AssistantResultCardResponseSerializer(many=True))
    def get_cards(self, obj: AssistantMessage) -> list[dict[str, Any]]:
        """Danh sách thẻ kết quả lưu trong `metadata.cards`."""
        metadata = obj.metadata if isinstance(obj.metadata, dict) else {}
        items = metadata.get("cards")
        if not isinstance(items, list):
            return []
        # Thẻ lưu từ phiên bản cũ có thể thiếu `kind_label`/`view_url`: bổ sung để FE luôn nhận đủ trường.
        return [
            {"kind_label": "", **item, "view_url": item.get("view_url") or item.get("url") or ""}
            for item in items
            if isinstance(item, dict)
        ]

    def to_representation(self, instance: AssistantMessage) -> dict[str, Any]:
        """Tin cũ (trước khi link chỉ nằm ở thẻ) còn chép link "Xem chi tiết" trong nội dung: gỡ khi đọc."""
        data = super().to_representation(instance)
        cards = data.get("cards") or []
        if cards and isinstance(data.get("content"), str):
            data["content"] = _CARD_BUILDER.strip_view_links(data["content"], cards) or data["content"]
        return data
