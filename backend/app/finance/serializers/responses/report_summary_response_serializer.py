"""Response báo cáo năm/tháng."""

from typing import Any

from rest_framework import serializers

from app.finance.serializers.responses.report_currency_response_serializer import (
    ReportCurrencyResponseSerializer,
)
from app.finance.serializers.responses.report_month_response_serializer import ReportMonthResponseSerializer
from app.finance.serializers.responses.report_platform_response_serializer import (
    ReportPlatformResponseSerializer,
)
from app.finance.serializers.responses.report_summary_totals_response_serializer import (
    ReportSummaryTotalsResponseSerializer,
)


class ReportSummaryResponseSerializer(serializers.Serializer[Any]):
    """Thẻ tổng, theo nền tảng, theo tháng (khi xem cả năm), theo tiền tệ."""

    year = serializers.IntegerField(help_text="Năm.")
    month = serializers.IntegerField(allow_null=True, help_text="Tháng (null = cả năm).")
    totals = ReportSummaryTotalsResponseSerializer(help_text="Tổng.")
    by_platform = ReportPlatformResponseSerializer(many=True, help_text="Theo nền tảng + %.")
    by_month = ReportMonthResponseSerializer(many=True, help_text="Theo tháng.")
    by_currency = ReportCurrencyResponseSerializer(many=True, help_text="Theo tiền tệ.")
