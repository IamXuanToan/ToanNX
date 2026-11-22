"""Query báo cáo."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer

MIN_YEAR = 2000
MAX_YEAR = 2100
MONTHS = 12


class ReportSummaryValidateSerializer(CoreValidateSerializer):
    """Năm (+ tháng)."""

    year = serializers.IntegerField(min_value=MIN_YEAR, max_value=MAX_YEAR, help_text="Năm.")
    month = serializers.IntegerField(
        min_value=1, max_value=MONTHS, required=False, allow_null=True, default=None, help_text="Tháng."
    )
