"""Validate tạo mới Mục tiêu giám sát Uptime/HTTP."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.workspace.constants.workspace_defaults import (
    MONITOR_MAX_TIMEOUT_SECONDS,
    MONITOR_MIN_INTERVAL_MINUTES,
)
from app.workspace.models.monitor_target import MonitorTarget


class MonitorTargetCreateValidateSerializer(CoreValidateSerializer):
    """Đầu vào tạo mục tiêu ping Uptime (`timeout <= 5s`, `interval >= 15 phút`)."""

    name = serializers.CharField(max_length=150, help_text="Tên gợi nhớ dịch vụ.")
    url = serializers.URLField(max_length=500, help_text="URL công khai cần giám sát.")
    method = serializers.ChoiceField(
        choices=MonitorTarget.Method.choices,
        required=False,
        default=MonitorTarget.Method.GET,
        help_text="Phương thức HTTP (`GET` hoặc `HEAD`).",
    )
    expected_status = serializers.IntegerField(
        min_value=100,
        max_value=599,
        required=False,
        default=200,
        help_text="Mã HTTP kỳ vọng (200 chấp nhận dải 200..399).",
    )
    timeout_seconds = serializers.IntegerField(
        min_value=1,
        max_value=MONITOR_MAX_TIMEOUT_SECONDS,
        required=False,
        default=4,
        help_text="Giới hạn timeout mỗi lượt ping (1–5 giây).",
    )
    check_interval_minutes = serializers.IntegerField(
        min_value=MONITOR_MIN_INTERVAL_MINUTES,
        max_value=1440,
        required=False,
        default=30,
        help_text="Chu kỳ kiểm tra tối thiểu 15 phút.",
    )
    is_active = serializers.BooleanField(required=False, default=True, help_text="Bật/tắt ping định kỳ.")
