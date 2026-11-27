"""Response Lịch Tổng hợp (`GET /workspace/calendar`)."""

from typing import Any

from rest_framework import serializers

from app.workspace.serializers.responses.workspace_calendar_event_response_serializer import (
    WorkspaceCalendarEventResponseSerializer,
)


class WorkspaceCalendarResponseSerializer(serializers.Serializer[Any]):
    """Danh sách sự kiện hợp nhất theo múi giờ và khoảng ngày yêu cầu."""

    timezone = serializers.CharField(help_text="Múi giờ đang áp dụng.")
    from_date = serializers.DateField(help_text="Ngày bắt đầu lọc.")
    to_date = serializers.DateField(help_text="Ngày kết thúc lọc.")
    events = WorkspaceCalendarEventResponseSerializer(many=True, help_text="Các sự kiện trong khoảng ngày.")
