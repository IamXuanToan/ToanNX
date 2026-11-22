"""Nhập tay tỷ giá."""

from decimal import Decimal

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class ExchangeRateValidateSerializer(CoreValidateSerializer):
    """Tỷ giá MANUAL (số VNĐ cho 1 đơn vị ngoại tệ)."""

    currency_id = serializers.UUIDField(help_text="Ngoại tệ.")
    rate_date = serializers.DateField(help_text="Ngày.")
    rate = serializers.DecimalField(
        max_digits=18, decimal_places=6, min_value=Decimal("0.000001"), help_text="Tỷ giá."
    )
    note = serializers.CharField(
        required=False, allow_blank=True, default="", help_text="Ghi chú (ví dụ nguồn NHNN)."
    )
