"""Response Nhắc việc cá nhân."""

from rest_framework import serializers

from app.workspace.models.reminder import Reminder


class ReminderResponseSerializer(serializers.ModelSerializer[Reminder]):
    """Chi tiết/danh sách nhắc việc cá nhân."""

    owner_email = serializers.CharField(source="owner.email", read_only=True, help_text="Email chủ sở hữu.")

    class Meta:
        model = Reminder
        fields = (
            "id",
            "owner_id",
            "owner_email",
            "title",
            "description",
            "due_date",
            "due_time",
            "notify_minutes_before",
            "priority",
            "is_completed",
            "completed_at",
            "recurrence",
            "anchor_day",
            "tags",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
