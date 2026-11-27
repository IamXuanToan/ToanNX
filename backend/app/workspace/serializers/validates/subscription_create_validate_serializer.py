"""Validate tạo mới Dịch vụ & Gói đăng ký định kỳ."""

from decimal import Decimal

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.workspace.constants.workspace_defaults import DEFAULT_REMINDER_DAYS_BEFORE
from app.workspace.models.subscription import Subscription


class SubscriptionCreateValidateSerializer(CoreValidateSerializer):
    """Đầu vào tạo gói dịch vụ định kỳ."""

    name = serializers.CharField(max_length=200, help_text="Tên dịch vụ hoặc tên miền.")
    provider = serializers.CharField(
        max_length=150, required=False, allow_blank=True, default="", help_text="Nhà cung cấp."
    )
    category = serializers.ChoiceField(
        choices=Subscription.Category.choices,
        required=False,
        default=Subscription.Category.SAAS_TOOL,
        help_text="Nhóm dịch vụ.",
    )
    billing_cycle = serializers.ChoiceField(
        choices=Subscription.BillingCycle.choices,
        required=False,
        default=Subscription.BillingCycle.MONTHLY,
        help_text="Chu kỳ gia hạn.",
    )
    custom_cycle_days = serializers.IntegerField(
        min_value=1,
        required=False,
        allow_null=True,
        default=None,
        help_text="Số ngày chu kỳ tùy chỉnh (bắt buộc > 0 khi chọn CUSTOM_DAYS).",
    )
    anchor_day = serializers.IntegerField(
        min_value=1,
        max_value=31,
        required=False,
        allow_null=True,
        default=None,
        help_text="Ngày chốt định kỳ (1–31; mặc định lấy theo ngày gia hạn).",
    )
    amount = serializers.DecimalField(
        max_digits=18,
        decimal_places=2,
        min_value=Decimal("0"),
        default=Decimal("0"),
        required=False,
        help_text="Mức phí theo nguyên tệ.",
    )
    currency_id = serializers.UUIDField(help_text="ID tiền tệ.")
    exchange_rate = serializers.DecimalField(
        max_digits=18,
        decimal_places=6,
        required=False,
        allow_null=True,
        min_value=Decimal("0.000001"),
        help_text="Tỷ giá quy đổi VNĐ (bắt buộc khi ngoại tệ chưa có tỷ giá tham chiếu).",
    )
    renew_date = serializers.DateField(help_text="Ngày gia hạn tiếp theo (YYYY-MM-DD).")
    auto_renew = serializers.BooleanField(
        required=False, default=False, help_text="Tự động trừ tiền qua thẻ/ví."
    )
    payment_method = serializers.CharField(
        max_length=150, required=False, allow_blank=True, default="", help_text="Phương thức thanh toán."
    )
    manage_url = serializers.URLField(
        max_length=500, required=False, allow_blank=True, default="", help_text="Link trang quản trị/billing."
    )
    reminder_days_before = serializers.ListField(
        child=serializers.IntegerField(min_value=0, max_value=365),
        required=False,
        default=lambda: list(DEFAULT_REMINDER_DAYS_BEFORE),
        help_text="Số ngày nhắc trước hạn (mặc định [7, 3, 1]).",
    )
    is_active = serializers.BooleanField(required=False, default=True, help_text="Đang theo dõi gia hạn.")
    notes = serializers.CharField(required=False, allow_blank=True, default="", help_text="Ghi chú.")
