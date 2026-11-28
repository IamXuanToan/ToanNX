"""Response nút trả lời nhanh của Trợ lý AI."""

from typing import Any

from rest_framework import serializers


class AssistantQuickReplyResponseSerializer(serializers.Serializer[Any]):
    """Nhãn hiển thị và nội dung sẽ gửi khi bấm."""

    caption = serializers.CharField(help_text="Nhãn hiển thị trên nút.")
    text = serializers.CharField(help_text="Nội dung tin nhắn gửi đi khi bấm nút.")
