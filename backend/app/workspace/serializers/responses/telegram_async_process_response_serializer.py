"""Response `POST /workspace/assistant/telegram-process` (xử lý 1-hop từ QStash)."""

from typing import Any

from rest_framework import serializers


class TelegramAsyncProcessResponseSerializer(serializers.Serializer[Any]):
    """Trạng thái xử lý tin nhắn Telegram bất đồng bộ."""

    handled = serializers.BooleanField(help_text="Đã định tuyến và xử lý thành công hay chưa.")
    queued = serializers.BooleanField(default=False, help_text="Có đẩy hàng đợi tiếp không.")
    replied_in_dm = serializers.BooleanField(
        default=False, help_text="Đã chuyển câu trả lời riêng tư sang DM hay chưa."
    )
    reason = serializers.CharField(
        default="", allow_blank=True, help_text="Lý do bỏ qua (nếu `handled=False`)."
    )
