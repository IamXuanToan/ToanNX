"""Response hóa đơn / chứng từ."""

from decimal import Decimal
from typing import Any

from rest_framework import serializers

from app.finance.models.income import Income
from app.finance.models.invoice import Invoice
from app.system.serializers.responses.attachment_detail_response_serializer import (
    AttachmentDetailResponseSerializer,
)


class InvoiceResponseSerializer(serializers.ModelSerializer[Invoice]):
    """Chứng từ + file + giao dịch gắn + đối chiếu (tính từ dữ liệu đã prefetch, không kết luận đúng/sai)."""

    owner_email = serializers.CharField(source="owner.email", read_only=True, help_text="Email chủ sở hữu.")
    owner_name = serializers.CharField(
        source="owner.full_name", read_only=True, default="", help_text="Tên chủ sở hữu."
    )
    owner_username = serializers.CharField(
        source="owner.username",
        read_only=True,
        allow_null=True,
        default="",
        help_text="Tên đăng nhập chủ sở hữu.",
    )
    platform_name = serializers.CharField(
        source="platform.name", read_only=True, default=None, help_text="Nền tảng."
    )
    currency_code = serializers.CharField(source="currency.code", read_only=True, help_text="Mã tiền tệ.")
    currency_symbol = serializers.CharField(source="currency.symbol", read_only=True, help_text="Ký hiệu.")
    currency_decimal_places = serializers.IntegerField(
        source="currency.decimal_places", read_only=True, help_text="Số lẻ."
    )
    attachments = AttachmentDetailResponseSerializer(many=True, read_only=True, help_text="File chứng từ.")
    income_ids: serializers.PrimaryKeyRelatedField[Income] = serializers.PrimaryKeyRelatedField(
        source="incomes", many=True, read_only=True, help_text="Giao dịch gắn."
    )
    reconciliation = serializers.SerializerMethodField(help_text="Tổng của giao dịch gắn và chênh lệch.")

    def get_reconciliation(self, obj: Invoice) -> dict[str, Any]:
        """N/T/G của giao dịch gắn so với chứng từ."""
        incomes = list(obj.incomes.all())
        amount = sum((item.amount or Decimal(0) for item in incomes), Decimal(0))
        tax = sum((item.tax_amount or Decimal(0) for item in incomes if item.tax_withheld), Decimal(0))
        gross = sum((item.gross_amount or Decimal(0) for item in incomes), Decimal(0))
        return {
            "income_count": len(incomes),
            "income_amount": str(amount),
            "income_tax_amount": str(tax),
            "income_gross_amount": str(gross),
            "gross_difference": str(obj.amount - gross),
            "tax_difference": str((obj.tax_amount or Decimal(0)) - tax),
        }

    class Meta:
        model = Invoice
        fields = (
            "id",
            "owner_id",
            "owner_email",
            "owner_name",
            "owner_username",
            "doc_type",
            "number",
            "issuer",
            "issuer_tax_code",
            "issued_on",
            "period_from",
            "period_to",
            "platform_id",
            "platform_name",
            "currency_id",
            "currency_code",
            "currency_symbol",
            "currency_decimal_places",
            "original_amount",
            "original_tax_amount",
            "exchange_rate",
            "rate_source",
            "rate_date",
            "amount",
            "tax_amount",
            "attachments",
            "income_ids",
            "reconciliation",
            "note",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
