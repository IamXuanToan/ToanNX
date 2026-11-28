"""Validate cập nhật một phần Nhắc việc cá nhân."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.workspace.models.reminder import Reminder


class ReminderUpdateValidateSerializer(CoreValidateSerializer):
    """Đầu vào PATCH nhắc việc."""

    title = serializers.CharField(max_length=255, required=False, help_text="Tiêu đề nhắc việc.")
    description = serializers.CharField(required=False, allow_blank=True, help_text="Mô tả chi tiết.")
    due_date = serializers.DateField(required=False, help_text="Ngày đến hạn.")
    due_time = serializers.TimeField(required=False, allow_null=True, help_text="Giờ đến hạn (HH:MM).")
    notify_minutes_before = serializers.IntegerField(
        min_value=0, max_value=10080, required=False, help_text="Số phút nhắc trước."
    )
    reminder_days_before = serializers.ListField(
        child=serializers.IntegerField(min_value=1, max_value=365),
        max_length=12,
        required=False,
        help_text="Danh sách số ngày nhắc trước hạn (ví dụ [7, 3, 1]).",
    )
    priority = serializers.ChoiceField(
        choices=Reminder.Priority.choices, required=False, help_text="Độ ưu tiên."
    )
    is_completed = serializers.BooleanField(required=False, help_text="Đánh dấu hoàn thành.")
    recurrence = serializers.ChoiceField(
        choices=Reminder.Recurrence.choices, required=False, help_text="Chu kỳ lặp lại."
    )
    topic_id = serializers.UUIDField(
        required=False, allow_null=True, help_text="ID chủ đề nhắc việc; null để gỡ."
    )
