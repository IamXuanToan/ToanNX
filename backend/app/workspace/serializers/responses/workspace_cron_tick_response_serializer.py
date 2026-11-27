"""Response `POST /workspace/cron/tick` và `POST /workspace/cron/dispatch-due`."""

from typing import Any

from rest_framework import serializers


class WorkspaceCronTickResponseSerializer(serializers.Serializer[Any]):
    """Kết quả thực thi đường W4 (Alerts / Digest)."""

    w4_ran = serializers.BooleanField(help_text="Đường W4 có thực sự quét DB đến hạn hay không.")
    w4_db_touched = serializers.BooleanField(help_text="Đường W4 có chạm DB hay không.")
    notifications_queued = serializers.IntegerField(help_text="Tổng thông báo ghi vào outbox.")
    kicked = serializers.BooleanField(help_text="Đã gọi `flush_kick()` tới QStash hay chưa.")
