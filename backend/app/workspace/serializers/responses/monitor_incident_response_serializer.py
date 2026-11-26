"""Response Sự cố giám sát Uptime/HTTP."""

from rest_framework import serializers

from app.workspace.models.monitor_incident import MonitorIncident


class MonitorIncidentResponseSerializer(serializers.ModelSerializer[MonitorIncident]):
    """Lịch sử sự cố downtime/phục hồi của endpoint."""

    owner_email = serializers.CharField(source="owner.email", read_only=True, help_text="Email chủ sở hữu.")
    target_name = serializers.CharField(
        source="target.name", read_only=True, help_text="Tên mục tiêu giám sát."
    )
    target_url = serializers.CharField(source="target.url", read_only=True, help_text="URL giám sát.")

    class Meta:
        model = MonitorIncident
        fields = (
            "id",
            "owner_id",
            "owner_email",
            "target_id",
            "target_name",
            "target_url",
            "started_at",
            "resolved_at",
            "status_code",
            "error_message",
            "duration_seconds",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
