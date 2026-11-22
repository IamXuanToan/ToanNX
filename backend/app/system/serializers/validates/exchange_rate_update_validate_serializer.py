"""Sửa tỷ giá nhập tay."""

from decimal import Decimal

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class ExchangeRateUpdateValidateSerializer(CoreValidateSerializer):
    """Chỉ đổi số và ghi chú."""

    rate = serializers.DecimalField(
        max_digits=18, decimal_places=6, min_value=Decimal("0.000001"), required=False, help_text="Tỷ giá."
    )
    note = serializers.CharField(required=False, allow_blank=True, help_text="Ghi chú.")
