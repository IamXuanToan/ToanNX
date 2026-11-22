"""Thêm mốc khấu trừ."""

from decimal import Decimal

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class PlatformTaxRateValidateSerializer(CoreValidateSerializer):
    """Từ ngày, có khấu trừ không, bao nhiêu % (service kiểm 0 < rate < 100)."""

    effective_from = serializers.DateField(help_text="Áp dụng từ ngày (giờ VN).")
    tax_withheld = serializers.BooleanField(help_text="Nền tảng khấu trừ trước khi trả.")
    rate = serializers.DecimalField(
        max_digits=5, decimal_places=2, required=False, default=Decimal(0), help_text="%."
    )
    note = serializers.CharField(required=False, allow_blank=True, default="", help_text="Ghi chú.")
