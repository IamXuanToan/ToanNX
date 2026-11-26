"""Validate query phân trang 1 luồng chat Web (`GET /workspace/assistant/thread`)."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class AssistantThreadQueryValidateSerializer(CoreValidateSerializer):
    """Tham số phân trang tin nhắn trong 1 luồng chat duy nhất."""

    page = serializers.IntegerField(min_value=1, required=False, default=1, help_text="Trang tin nhắn cũ.")
    page_size = serializers.IntegerField(
        min_value=1, max_value=100, required=False, default=50, help_text="Số tin mỗi trang."
    )
