"""Response thông tin nhận diện Chatbot AI chỉ đọc cho nút tròn Portal."""

from typing import Any

from rest_framework import serializers

from app.system.serializers.responses.attachment_summary_response_serializer import (
    AttachmentSummaryResponseSerializer,
)
from app.workspace.constants.assistant_launcher_size import AssistantLauncherSize


class AssistantBotProfileResponseSerializer(serializers.Serializer[Any]):
    """Avatar, tên hiển thị, kích thước nút tròn và model đang chạy (không lộ policy nội bộ)."""

    name = serializers.CharField(allow_blank=True, help_text="Tên hiển thị Chatbot AI.")
    avatar = AttachmentSummaryResponseSerializer(allow_null=True, help_text="Ảnh đại diện Chatbot AI.")
    launcher_size = serializers.ChoiceField(
        choices=[(item.value, item.value) for item in AssistantLauncherSize],
        help_text="Kích thước nút tròn Chatbot AI nổi trên giao diện Portal (`sm`, `md`, `lg`).",
    )
    active_model = serializers.CharField(allow_blank=True, help_text="Model AI đang kích hoạt.")
    has_custom_policy = serializers.BooleanField(help_text="Admin đã thiết lập Policy riêng hay chưa.")
