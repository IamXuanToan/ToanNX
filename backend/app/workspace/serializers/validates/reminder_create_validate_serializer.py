"""Validate tạo mới Nhắc việc cá nhân."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.workspace.models.reminder import Reminder


class ReminderCreateValidateSerializer(CoreValidateSerializer):
    """Đầu vào tạo nhắc việc cá nhân."""

    title = serializers.CharField(max_length=255, help_text="Tiêu đề nhắc việc.")
    description = serializers.CharField(
        required=False, allow_blank=True, default="", help_text="Mô tả chi tiết."
    )
    due_date = serializers.DateField(help_text="Ngày đến hạn (YYYY-MM-DD).")
    due_time = serializers.TimeField(
        required=False, allow_null=True, default=None, help_text="Giờ đến hạn (HH:MM)."
    )
    notify_minutes_before = serializers.IntegerField(
        min_value=0,
        max_value=10080,
        required=False,
        default=0,
        help_text="Số phút nhắc trước thời điểm đến hạn.",
    )
    reminder_days_before = serializers.ListField(
        child=serializers.IntegerField(min_value=1, max_value=365),
        max_length=12,
        required=False,
        default=list,
        help_text="Danh sách số ngày nhắc trước hạn (ví dụ [7, 3, 1]).",
    )
    priority = serializers.ChoiceField(
        choices=Reminder.Priority.choices,
        required=False,
        default=Reminder.Priority.MEDIUM,
        help_text="Độ ưu tiên công việc.",
    )
    recurrence = serializers.ChoiceField(
        choices=Reminder.Recurrence.choices,
        required=False,
        default=Reminder.Recurrence.NONE,
        help_text="Chu kỳ lặp lại.",
    )
    topic_id = serializers.UUIDField(
        required=False,
        allow_null=True,
        default=None,
        help_text="ID chủ đề nhắc việc (mặc định hệ thống hoặc của chủ sở hữu).",
    )
