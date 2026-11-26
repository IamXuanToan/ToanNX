"""Validate cập nhật Mục tiêu giám sát Uptime/HTTP."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.workspace.constants.workspace_defaults import (
    MONITOR_MAX_TIMEOUT_SECONDS,
    MONITOR_MIN_INTERVAL_MINUTES,
)
from app.workspace.models.monitor_target import MonitorTarget


class MonitorTargetUpdateValidateSerializer(CoreValidateSerializer):
    """Đầu vào PATCH mục tiêu Uptime."""

    name = serializers.CharField(max_length=150, required=False, help_text="Tên gợi nhớ dịch vụ.")
    url = serializers.URLField(max_length=500, required=False, help_text="URL công khai cần giám sát.")
    method = serializers.ChoiceField(
        choices=MonitorTarget.Method.choices, required=False, help_text="Phương thức HTTP."
    )
    expected_status = serializers.IntegerField(
        min_value=100, max_value=599, required=False, help_text="Mã HTTP kỳ vọng."
    )
    timeout_seconds = serializers.IntegerField(
        min_value=1,
        max_value=MONITOR_MAX_TIMEOUT_SECONDS,
        required=False,
        help_text="Timeout (1–5 giây).",
    )
    check_interval_minutes = serializers.IntegerField(
        min_value=MONITOR_MIN_INTERVAL_MINUTES,
        max_value=1440,
        required=False,
        help_text="Chu kỳ kiểm tra (phút, >= 15).",
    )
    is_active = serializers.BooleanField(required=False, help_text="Đang bật giám sát.")
