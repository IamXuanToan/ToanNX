"""Query dashboard."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer

MIN_YEAR = 2000
MAX_YEAR = 2100


class ReportMonthlyValidateSerializer(CoreValidateSerializer):
    """Năm."""

    year = serializers.IntegerField(min_value=MIN_YEAR, max_value=MAX_YEAR, help_text="Năm.")
