"""Tổng của kỳ báo cáo."""

from rest_framework import serializers

from app.finance.serializers.responses.report_totals_response_serializer import ReportTotalsResponseSerializer


class ReportSummaryTotalsResponseSerializer(ReportTotalsResponseSerializer):
    """Tổng kỳ + số giao dịch cần xử lý."""

    needs_review = serializers.IntegerField(help_text="Giao dịch cần xử lý trong kỳ.")
