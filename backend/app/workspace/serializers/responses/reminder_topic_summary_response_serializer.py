"""Response tóm tắt Chủ đề gắn trên Nhắc việc."""

from rest_framework import serializers

from app.workspace.models.reminder_topic import ReminderTopic


class ReminderTopicSummaryResponseSerializer(serializers.ModelSerializer[ReminderTopic]):
    """Thông tin rút gọn của chủ đề nhắc việc."""

    class Meta:
        model = ReminderTopic
        fields = ("id", "name", "color", "is_system")
        read_only_fields = fields
