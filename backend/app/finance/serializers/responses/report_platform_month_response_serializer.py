"""Thu nhập một nền tảng trong một tháng."""

from typing import Any

from rest_framework import serializers


class ReportPlatformMonthResponseSerializer(serializers.Serializer[Any]):
    """Thu nhập một nền tảng trong một tháng (dashboard)."""

    month = serializers.IntegerField(help_text="Tháng.")
    platform = serializers.CharField(allow_blank=True, help_text="Nền tảng (rỗng = chưa nhận diện).")
    color = serializers.CharField(allow_blank=True, help_text="Mã màu HEX (#RRGGBB) của nền tảng.")
    total = serializers.DecimalField(max_digits=20, decimal_places=0, help_text="VNĐ.")
