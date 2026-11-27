"""Một dòng theo nền tảng + %."""

from rest_framework import serializers

from app.finance.serializers.responses.report_totals_response_serializer import ReportTotalsResponseSerializer


class ReportPlatformResponseSerializer(ReportTotalsResponseSerializer):
    """Nền tảng (rỗng = chưa nhận diện), có/không khấu trừ, %."""

    platform_id = serializers.UUIDField(allow_null=True, help_text="Nền tảng.")
    platform = serializers.CharField(allow_blank=True, help_text="Tên nền tảng.")
    color = serializers.CharField(allow_blank=True, help_text="Mã màu HEX (#RRGGBB) của nền tảng.")
    tax_withheld = serializers.BooleanField(help_text="Khấu trừ.")
    tax_rate = serializers.DecimalField(max_digits=5, decimal_places=2, help_text="%.")
