"""Response giao dịch thu nhập."""

from rest_framework import serializers

from app.finance.models.income import Income


class IncomeResponseSerializer(serializers.ModelSerializer[Income]):
    """Số gốc + quy đổi + khấu trừ đã chụp; không trả payload SePay ở danh sách."""

    owner_email = serializers.CharField(source="owner.email", read_only=True, help_text="Email chủ sở hữu.")
    owner_name = serializers.CharField(
        source="owner.full_name", read_only=True, default="", help_text="Tên chủ sở hữu."
    )
    platform_name = serializers.CharField(
        source="platform.name", read_only=True, default=None, help_text="Nền tảng."
    )
    currency_code = serializers.CharField(source="currency.code", read_only=True, help_text="Mã tiền tệ.")
    currency_symbol = serializers.CharField(source="currency.symbol", read_only=True, help_text="Ký hiệu.")
    currency_decimal_places = serializers.IntegerField(
        source="currency.decimal_places", read_only=True, help_text="Số lẻ."
    )
    matched_rule_name = serializers.CharField(
        source="matched_rule.name", read_only=True, default=None, help_text="Quy tắc khớp."
    )
    invoice_ids = serializers.SerializerMethodField(help_text="Hóa đơn/chứng từ gắn.")
    needs_review = serializers.SerializerMethodField(help_text="Cần xử lý.")

    def get_invoice_ids(self, obj: Income) -> list[str]:
        """Id chứng từ chưa xóa (đã prefetch)."""
        return [str(invoice.pk) for invoice in obj.invoices.all() if invoice.deleted_at is None]

    def get_needs_review(self, obj: Income) -> bool:
        """Không rõ số tiền, chưa nhận diện hoặc nền tảng chưa có mốc thuế."""
        return obj.amount_status == Income.AmountStatus.UNKNOWN or obj.tax_status in (
            Income.TaxStatus.UNCLASSIFIED,
            Income.TaxStatus.NO_RATE,
        )

    class Meta:
        model = Income
        fields = (
            "id",
            "owner_id",
            "owner_email",
            "owner_name",
            "source",
            "received_at",
            "received_date",
            "content",
            "note",
            "currency_id",
            "currency_code",
            "currency_symbol",
            "currency_decimal_places",
            "original_amount",
            "exchange_rate",
            "rate_source",
            "rate_date",
            "amount",
            "amount_status",
            "platform_id",
            "platform_name",
            "matched_rule_id",
            "matched_rule_name",
            "is_platform_locked",
            "tax_withheld",
            "tax_rate",
            "tax_amount",
            "gross_amount",
            "is_tax_manual",
            "tax_status",
            "reference_code",
            "bank_name",
            "account_last4",
            "invoice_ids",
            "needs_review",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
