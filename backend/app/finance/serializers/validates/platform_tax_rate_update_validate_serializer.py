"""Sửa mốc khấu trừ."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class PlatformTaxRateUpdateValidateSerializer(CoreValidateSerializer):
    """Mọi field tùy chọn."""

    effective_from = serializers.DateField(required=False, help_text="Áp dụng từ ngày.")
    tax_withheld = serializers.BooleanField(required=False, help_text="Khấu trừ.")
    rate = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, help_text="%.")
    note = serializers.CharField(required=False, allow_blank=True, help_text="Ghi chú.")
