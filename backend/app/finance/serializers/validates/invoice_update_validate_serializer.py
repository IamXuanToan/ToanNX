"""Sửa hóa đơn / chứng từ."""

from decimal import Decimal

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.finance.constants.finance_choices import RateSource
from app.finance.models.invoice import Invoice

MANUAL_SOURCES = (
    (RateSource.API.value, RateSource.API.label),
    (RateSource.MANUAL.value, RateSource.MANUAL.label),
)


class InvoiceUpdateValidateSerializer(CoreValidateSerializer):
    """Mọi field tùy chọn; gửi `attachment_ids`/`income_ids` thì đồng bộ lại."""

    doc_type = serializers.ChoiceField(choices=Invoice.DocType.choices, required=False, help_text="Loại.")
    number = serializers.CharField(max_length=100, required=False, allow_blank=True, help_text="Số.")
    issuer = serializers.CharField(max_length=255, required=False, help_text="Bên phát hành.")
    issuer_tax_code = serializers.CharField(max_length=50, required=False, allow_blank=True, help_text="MST.")
    issued_on = serializers.DateField(required=False, help_text="Ngày lập.")
    period_from = serializers.DateField(required=False, allow_null=True, help_text="Kỳ từ.")
    period_to = serializers.DateField(required=False, allow_null=True, help_text="Kỳ đến.")
    platform_id = serializers.UUIDField(required=False, allow_null=True, help_text="Nền tảng.")
    currency_id = serializers.UUIDField(required=False, help_text="Tiền tệ.")
    original_amount = serializers.DecimalField(
        max_digits=18, decimal_places=4, required=False, min_value=Decimal(0), help_text="Tổng tiền."
    )
    original_tax_amount = serializers.DecimalField(
        max_digits=18,
        decimal_places=4,
        required=False,
        allow_null=True,
        min_value=Decimal(0),
        help_text="Tiền thuế.",
    )
    rate_source = serializers.ChoiceField(choices=MANUAL_SOURCES, required=False, help_text="API / MANUAL.")
    exchange_rate = serializers.DecimalField(
        max_digits=18,
        decimal_places=6,
        required=False,
        allow_null=True,
        min_value=Decimal("0.000001"),
        help_text="Tỷ giá.",
    )
    attachment_ids = serializers.ListField(
        child=serializers.UUIDField(), required=False, allow_empty=False, help_text="File."
    )
    income_ids = serializers.ListField(
        child=serializers.UUIDField(), required=False, help_text="Giao dịch gắn."
    )
    note = serializers.CharField(required=False, allow_blank=True, help_text="Ghi chú.")
