"""Response Nhắc việc cá nhân."""

from rest_framework import serializers

from app.workspace.models.reminder import Reminder
from app.workspace.serializers.responses.reminder_topic_summary_response_serializer import (
    ReminderTopicSummaryResponseSerializer,
)


class ReminderResponseSerializer(serializers.ModelSerializer[Reminder]):
    """Chi tiết/danh sách nhắc việc cá nhân."""

    topic = ReminderTopicSummaryResponseSerializer(
        read_only=True, allow_null=True, help_text="Chủ đề nhắc việc."
    )

    owner_email = serializers.CharField(source="owner.email", read_only=True, help_text="Email chủ sở hữu.")
    owner_name = serializers.CharField(
        source="owner.full_name", read_only=True, default="", help_text="Tên chủ sở hữu."
    )
    owner_username = serializers.CharField(
        source="owner.username",
        read_only=True,
        allow_null=True,
        default="",
        help_text="Tên đăng nhập chủ sở hữu.",
    )

    class Meta:
        model = Reminder
        fields = (
            "id",
            "owner_id",
            "owner_email",
            "owner_name",
            "owner_username",
            "title",
            "description",
            "due_date",
            "due_time",
            "notify_minutes_before",
            "reminder_days_before",
            "priority",
            "is_completed",
            "completed_at",
            "recurrence",
            "topic",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
