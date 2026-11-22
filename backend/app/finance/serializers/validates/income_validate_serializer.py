"""Nhập tay giao dịch thu nhập."""

from decimal import Decimal

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.finance.constants.finance_choices import RateSource

MANUAL_SOURCES = (
    (RateSource.API.value, RateSource.API.label),
    (RateSource.MANUAL.value, RateSource.MANUAL.label),
)


class IncomeValidateSerializer(CoreValidateSerializer):
    """Số gốc theo tiền tệ; ngoại tệ thì tỷ giá tự động (API) hoặc nhập tay. Thuế tay tùy chọn."""

    received_at = serializers.DateTimeField(help_text="Thời điểm nhận.")
    platform_id = serializers.UUIDField(
        required=False, allow_null=True, default=None, help_text="Nền tảng (trống = tự nhận diện)."
    )
    currency_id = serializers.UUIDField(help_text="Tiền tệ.")
    original_amount = serializers.DecimalField(
        max_digits=18, decimal_places=4, min_value=Decimal("0.0001"), help_text="Số tiền gốc."
    )
    rate_source = serializers.ChoiceField(
        choices=MANUAL_SOURCES, required=False, default=RateSource.API.value, help_text="API / MANUAL."
    )
    exchange_rate = serializers.DecimalField(
        max_digits=18,
        decimal_places=6,
        required=False,
        allow_null=True,
        min_value=Decimal("0.000001"),
        help_text="Tỷ giá (MANUAL).",
    )
    content = serializers.CharField(required=False, allow_blank=True, default="", help_text="Nội dung.")
    note = serializers.CharField(required=False, allow_blank=True, default="", help_text="Ghi chú tham khảo.")
    is_tax_manual = serializers.BooleanField(required=False, default=False, help_text="Tự nhập khấu trừ.")
    tax_withheld = serializers.BooleanField(
        required=False, default=False, help_text="Đã khấu trừ (thuế tay)."
    )
    tax_rate = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        required=False,
        default=Decimal(0),
        min_value=Decimal(0),
        max_value=Decimal("99.99"),
        help_text="% (thuế tay).",
    )
    tax_amount = serializers.DecimalField(
        max_digits=18,
        decimal_places=0,
        required=False,
        allow_null=True,
        min_value=Decimal(0),
        help_text="Tiền thuế bị khấu trừ (thuế tay).",
    )
