"""Một dòng theo tiền tệ."""

from typing import Any

from rest_framework import serializers


class ReportCurrencyResponseSerializer(serializers.Serializer[Any]):
    """Tổng số gốc và tổng VNĐ của một tiền tệ."""

    currency = serializers.CharField(help_text="Mã tiền tệ.")
    symbol = serializers.CharField(help_text="Ký hiệu.")
    decimal_places = serializers.IntegerField(help_text="Số lẻ.")
    count = serializers.IntegerField(help_text="Số giao dịch.")
    original = serializers.DecimalField(max_digits=22, decimal_places=4, help_text="Tổng số gốc.")
    total = serializers.DecimalField(max_digits=20, decimal_places=0, help_text="Tổng VNĐ.")
