"""Bộ lọc cho Lịch sử thanh toán gia hạn dịch vụ định kỳ."""

import django_filters

from app.core.filters.core_uuid_in_filter import CoreUUIDInFilter
from app.workspace.models.subscription_payment import SubscriptionPayment


class SubscriptionPaymentFilter(django_filters.FilterSet):
    """Lọc lịch sử gia hạn theo dịch vụ, tiền tệ và chủ sở hữu."""

    subscription = CoreUUIDInFilter(
        field_name="subscription_id",
        help_text="ID gói dịch vụ (nhiều giá trị phân tách dấu phẩy).",
    )
    currency = CoreUUIDInFilter(
        field_name="currency_id",
        help_text="ID tiền tệ thanh toán.",
    )
    owner = CoreUUIDInFilter(
        field_name="owner_id",
        help_text="ID chủ sở hữu (chỉ áp dụng khi có quyền manage_all).",
    )

    class Meta:
        model = SubscriptionPayment
        fields = ("subscription", "currency", "owner")
