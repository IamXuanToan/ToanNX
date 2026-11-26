"""Response thông tin nhận diện Chatbot AI chỉ đọc cho nút tròn Portal."""

from typing import Any

from rest_framework import serializers

from app.system.serializers.responses.attachment_summary_response_serializer import (
    AttachmentSummaryResponseSerializer,
)


class AssistantBotProfileResponseSerializer(serializers.Serializer[Any]):
    """Avatar, tên hiển thị và model đang chạy (không lộ policy nội bộ hay quyền cấu hình)."""

    name = serializers.CharField(allow_blank=True, help_text="Tên hiển thị Chatbot AI.")
    avatar = AttachmentSummaryResponseSerializer(allow_null=True, help_text="Ảnh đại diện Chatbot AI.")
    active_model = serializers.CharField(allow_blank=True, help_text="Model AI đang kích hoạt.")
    has_custom_policy = serializers.BooleanField(help_text="Admin đã thiết lập Policy riêng hay chưa.")
