"""Response Mục tiêu giám sát Uptime/HTTP."""

from rest_framework import serializers

from app.workspace.models.monitor_target import MonitorTarget


class MonitorTargetResponseSerializer(serializers.ModelSerializer[MonitorTarget]):
    """Trạng thái & cấu hình mục tiêu giám sát Uptime."""

    owner_email = serializers.CharField(source="owner.email", read_only=True, help_text="Email chủ sở hữu.")

    class Meta:
        model = MonitorTarget
        fields = (
            "id",
            "owner_id",
            "owner_email",
            "name",
            "url",
            "method",
            "expected_status",
            "timeout_seconds",
            "check_interval_minutes",
            "is_active",
            "last_status",
            "last_status_code",
            "last_latency_ms",
            "last_checked_at",
            "consecutive_failures",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
