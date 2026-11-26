"""Response Lịch sử thanh toán gia hạn dịch vụ định kỳ."""

from rest_framework import serializers

from app.system.serializers.responses.attachment_detail_response_serializer import (
    AttachmentDetailResponseSerializer,
)
from app.workspace.models.subscription_payment import SubscriptionPayment


class SubscriptionPaymentResponseSerializer(serializers.ModelSerializer[SubscriptionPayment]):
    """Chi tiết một kỳ thanh toán gia hạn (bao gồm tỷ giá lịch sử và biên lai riêng tư)."""

    owner_email = serializers.CharField(source="owner.email", read_only=True, help_text="Email chủ sở hữu.")
    subscription_name = serializers.CharField(
        source="subscription.name", read_only=True, help_text="Tên gói dịch vụ."
    )
    currency_code = serializers.CharField(source="currency.code", read_only=True, help_text="Mã tiền tệ.")
    currency_symbol = serializers.CharField(
        source="currency.symbol", read_only=True, help_text="Ký hiệu tiền tệ."
    )
    currency_decimal_places = serializers.IntegerField(
        source="currency.decimal_places", read_only=True, help_text="Số chữ số thập phân."
    )
    receipt_attachment = AttachmentDetailResponseSerializer(
        read_only=True, allow_null=True, help_text="Biên lai thanh toán riêng tư (nếu có)."
    )

    class Meta:
        model = SubscriptionPayment
        fields = (
            "id",
            "owner_id",
            "owner_email",
            "subscription_id",
            "subscription_name",
            "paid_on",
            "period_from",
            "period_to",
            "amount",
            "currency_id",
            "currency_code",
            "currency_symbol",
            "currency_decimal_places",
            "exchange_rate",
            "amount_vnd",
            "payment_method",
            "receipt_attachment_id",
            "receipt_attachment",
            "note",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
