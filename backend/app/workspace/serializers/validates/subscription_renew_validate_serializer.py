"""Validate gia hạn gói dịch vụ (`POST /subscriptions/{id}/renew`)."""

from decimal import Decimal

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer

ADVANCE_CHOICES = (("cycle", "Cộng tiếp từ mốc gia hạn cũ"), ("today", "Tính từ ngày thanh toán"))


class SubscriptionRenewValidateSerializer(CoreValidateSerializer):
    """Đầu vào tùy chọn khi xác nhận đã thanh toán gia hạn."""

    paid_on = serializers.DateField(
        required=False, allow_null=True, default=None, help_text="Ngày thanh toán thực tế (mặc định hôm nay)."
    )
    amount = serializers.DecimalField(
        max_digits=18,
        decimal_places=2,
        min_value=Decimal("0"),
        required=False,
        allow_null=True,
        default=None,
        help_text="Số tiền thực trả theo nguyên tệ (bỏ trống lấy theo giá niêm yết).",
    )
    exchange_rate = serializers.DecimalField(
        max_digits=18,
        decimal_places=6,
        required=False,
        allow_null=True,
        min_value=Decimal("0.000001"),
        help_text="Tỷ giá thực tế ngày thanh toán (nếu bỏ trống sẽ tra ExchangeRate <= paid_on).",
    )
    payment_method = serializers.CharField(
        max_length=150, required=False, allow_blank=True, default="", help_text="Phương thức thanh toán."
    )
    receipt_attachment_id = serializers.UUIDField(
        required=False, allow_null=True, default=None, help_text="ID tệp biên lai riêng tư."
    )
    note = serializers.CharField(
        required=False, allow_blank=True, default="", help_text="Ghi chú kỳ thanh toán."
    )
    advance_from = serializers.ChoiceField(
        choices=ADVANCE_CHOICES,
        required=False,
        default="cycle",
        help_text="Tính kỳ kế tiếp từ mốc `cycle` cũ hay từ ngày thanh toán `today`.",
    )
