"""Response kết quả làm mới 1 luồng chat Web (`DELETE /workspace/assistant/thread`)."""

from typing import Any

from rest_framework import serializers


class AssistantThreadClearResponseSerializer(serializers.Serializer[Any]):
    """Số tin nhắn đã dọn khỏi luồng chat Web."""

    deleted_count = serializers.IntegerField(help_text="Số tin nhắn đã xóa khỏi luồng.")
