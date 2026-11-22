"""Response tra cứu tỷ giá cho một ngày."""

from typing import Any

from rest_framework import serializers


class ExchangeRateResolveResponseSerializer(serializers.Serializer[Any]):
    """`rate_date` có thể sớm hơn ngày hỏi (lùi qua ngày nghỉ)."""

    rate = serializers.DecimalField(max_digits=18, decimal_places=6, help_text="Số VNĐ cho 1 đơn vị.")
    rate_date = serializers.DateField(help_text="Ngày của tỷ giá đã dùng.")
    rate_source = serializers.CharField(
        source="source", help_text="BASE / VIETCOMBANK_TRANSFER_BUY / MANUAL."
    )
