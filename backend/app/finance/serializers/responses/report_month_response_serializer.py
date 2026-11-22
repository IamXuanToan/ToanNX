"""Một tháng trong báo cáo."""

from rest_framework import serializers

from app.finance.serializers.responses.report_totals_response_serializer import ReportTotalsResponseSerializer


class ReportMonthResponseSerializer(ReportTotalsResponseSerializer):
    """Tháng 1–12."""

    month = serializers.IntegerField(help_text="Tháng.")
