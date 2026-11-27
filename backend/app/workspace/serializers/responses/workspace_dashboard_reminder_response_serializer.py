"""Response mục Nhắc việc ngắn trên thẻ Dashboard."""

from typing import Any

from rest_framework import serializers


class WorkspaceDashboardReminderResponseSerializer(serializers.Serializer[Any]):
    """Nhắc việc rút gọn hiển thị trên Dashboard Portal."""

    id = serializers.UUIDField(help_text="ID nhắc việc.")
    title = serializers.CharField(help_text="Tiêu đề nhắc việc.")
    due_date = serializers.DateField(help_text="Ngày đến hạn.")
    due_time = serializers.CharField(allow_blank=True, help_text="Giờ đến hạn (HH:MM).")
    priority = serializers.CharField(help_text="Mức ưu tiên.")
    is_completed = serializers.BooleanField(help_text="Trạng thái hoàn thành.")
