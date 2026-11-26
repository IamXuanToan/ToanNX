"""Response `POST /workspace/cron/tick` và `POST /workspace/cron/dispatch-due`."""

from typing import Any

from rest_framework import serializers


class WorkspaceCronTickResponseSerializer(serializers.Serializer[Any]):
    """Kết quả thực thi đường W1 (Monitor) và đường W4 (Alerts)."""

    w1_checked = serializers.IntegerField(help_text="Số endpoint đã ping trong lượt W1.")
    w1_flipped = serializers.IntegerField(help_text="Số endpoint đổi trạng thái HEALTHY <-> DOWN.")
    w1_flushed = serializers.IntegerField(help_text="Số monitor đồng bộ định kỳ 6h xuống DB.")
    w1_db_touched = serializers.BooleanField(help_text="Đường W1 có mở kết nối DB hay không.")
    w4_ran = serializers.BooleanField(help_text="Đường W4 có thực sự quét DB đến hạn hay không.")
    w4_db_touched = serializers.BooleanField(help_text="Đường W4 có chạm DB hay không.")
    notifications_queued = serializers.IntegerField(help_text="Tổng thông báo ghi vào outbox.")
    kicked = serializers.BooleanField(help_text="Đã gọi `flush_kick()` tới QStash hay chưa.")
