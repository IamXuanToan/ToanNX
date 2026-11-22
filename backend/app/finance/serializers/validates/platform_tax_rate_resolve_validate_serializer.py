"""Query mốc khấu trừ theo ngày."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class PlatformTaxRateResolveValidateSerializer(CoreValidateSerializer):
    """Ngày nhận tiền (giờ VN)."""

    date = serializers.DateField(help_text="Ngày.")
