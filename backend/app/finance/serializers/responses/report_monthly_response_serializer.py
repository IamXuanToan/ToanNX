"""Response dữ liệu dashboard theo tháng."""

from typing import Any

from rest_framework import serializers

from app.finance.serializers.responses.report_month_response_serializer import ReportMonthResponseSerializer
from app.finance.serializers.responses.report_platform_month_response_serializer import (
    ReportPlatformMonthResponseSerializer,
)


class ReportMonthlyResponseSerializer(serializers.Serializer[Any]):
    """12 tháng năm chọn, 12 tháng năm trước, theo nền tảng."""

    year = serializers.IntegerField(help_text="Năm.")
    months = ReportMonthResponseSerializer(many=True, help_text="Năm chọn.")
    previous_months = ReportMonthResponseSerializer(many=True, help_text="Năm trước.")
    by_platform = ReportPlatformMonthResponseSerializer(many=True, help_text="Theo nền tảng từng tháng.")
