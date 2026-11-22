"""Các tổng dùng chung của báo cáo."""

from typing import Any

from rest_framework import serializers


class ReportTotalsResponseSerializer(serializers.Serializer[Any]):
    """Tổng thu nhập, đã khấu trừ (+ tiền thuế), chưa khấu trừ (gồm chưa nhận diện)."""

    count = serializers.IntegerField(help_text="Số giao dịch.")
    total = serializers.DecimalField(
        max_digits=20, decimal_places=0, coerce_to_string=True, help_text="Tổng thu nhập (VNĐ)."
    )
    withheld = serializers.DecimalField(
        max_digits=20, decimal_places=0, coerce_to_string=True, help_text="Thu nhập đã khấu trừ thuế."
    )
    tax = serializers.DecimalField(
        max_digits=20, decimal_places=0, coerce_to_string=True, help_text="Tiền thuế đã bị khấu trừ."
    )
    not_withheld = serializers.DecimalField(
        max_digits=20,
        decimal_places=0,
        coerce_to_string=True,
        help_text="Thu nhập chưa khấu trừ (gồm chưa nhận diện).",
    )
    unclassified = serializers.DecimalField(
        max_digits=20, decimal_places=0, coerce_to_string=True, help_text="Trong đó chưa nhận diện."
    )
