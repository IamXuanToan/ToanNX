"""Response chi tiết/danh sách Chủ đề nhắc việc."""

from rest_framework import serializers

from app.workspace.models.reminder_topic import ReminderTopic


class ReminderTopicResponseSerializer(serializers.ModelSerializer[ReminderTopic]):
    """Chi tiết chủ đề nhắc việc (hệ thống và cá nhân)."""

    class Meta:
        model = ReminderTopic
        fields = (
            "id",
            "owner_id",
            "code",
            "name",
            "color",
            "sort_order",
            "is_system",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
