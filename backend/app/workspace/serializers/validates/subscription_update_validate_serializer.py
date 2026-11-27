"""Validate cập nhật một phần Dịch vụ & Gói đăng ký định kỳ."""

from decimal import Decimal

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.workspace.models.subscription import Subscription


class SubscriptionUpdateValidateSerializer(CoreValidateSerializer):
    """Đầu vào PATCH dịch vụ định kỳ."""

    name = serializers.CharField(max_length=200, required=False, help_text="Tên dịch vụ.")
    provider = serializers.CharField(
        max_length=150, required=False, allow_blank=True, help_text="Nhà cung cấp."
    )
    category = serializers.ChoiceField(
        choices=Subscription.Category.choices, required=False, help_text="Nhóm dịch vụ."
    )
    billing_cycle = serializers.ChoiceField(
        choices=Subscription.BillingCycle.choices, required=False, help_text="Chu kỳ gia hạn."
    )
    custom_cycle_days = serializers.IntegerField(
        min_value=1, required=False, allow_null=True, help_text="Số ngày chu kỳ tùy chỉnh."
    )
    anchor_day = serializers.IntegerField(
        min_value=1, max_value=31, required=False, help_text="Ngày chốt định kỳ (1–31)."
    )
    amount = serializers.DecimalField(
        max_digits=18,
        decimal_places=2,
        min_value=Decimal("0"),
        required=False,
        help_text="Mức phí nguyên tệ.",
    )
    currency_id = serializers.UUIDField(required=False, help_text="ID tiền tệ.")
    exchange_rate = serializers.DecimalField(
        max_digits=18,
        decimal_places=6,
        required=False,
        allow_null=True,
        min_value=Decimal("0.000001"),
        help_text="Tỷ giá quy đổi VNĐ.",
    )
    renew_date = serializers.DateField(required=False, help_text="Ngày gia hạn tiếp theo.")
    auto_renew = serializers.BooleanField(required=False, help_text="Tự động trừ tiền.")
    payment_method = serializers.CharField(
        max_length=150, required=False, allow_blank=True, help_text="Phương thức thanh toán."
    )
    manage_url = serializers.URLField(
        max_length=500, required=False, allow_blank=True, help_text="Link trang quản trị."
    )
    reminder_days_before = serializers.ListField(
        child=serializers.IntegerField(min_value=0, max_value=365),
        required=False,
        help_text="Danh sách số ngày nhắc trước hạn.",
    )
    is_active = serializers.BooleanField(required=False, help_text="Đang theo dõi gia hạn.")
    notes = serializers.CharField(required=False, allow_blank=True, help_text="Ghi chú.")
