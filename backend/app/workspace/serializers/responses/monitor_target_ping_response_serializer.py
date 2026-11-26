"""Response kết quả ping thủ công `POST /workspace/monitor-targets/{id}/ping`."""

from typing import Any

from rest_framework import serializers


class MonitorTargetPingResponseSerializer(serializers.Serializer[Any]):
    """Kết quả kiểm tra tức thời một URL giám sát."""

    target_id = serializers.UUIDField(help_text="ID mục tiêu giám sát.")
    status = serializers.CharField(help_text="Trạng thái sau lần ping (`HEALTHY`/`DOWN`).")
    status_code = serializers.IntegerField(allow_null=True, help_text="HTTP status code trả về.")
    latency_ms = serializers.IntegerField(allow_null=True, help_text="Độ trễ phản hồi (ms).")
    checked_at = serializers.DateTimeField(help_text="Thời điểm kiểm tra.")
    error_message = serializers.CharField(allow_blank=True, help_text="Thông báo lỗi (nếu có).")
    incident_id = serializers.UUIDField(allow_null=True, help_text="ID sự cố đang mở/mới đóng (nếu có).")
