"""Bộ lọc cho Dịch vụ & Gói đăng ký định kỳ."""

import django_filters

from app.core.filters.core_boolean_in_filter import CoreBooleanInFilter
from app.core.filters.core_choice_in_filter import CoreChoiceInFilter
from app.core.filters.core_uuid_in_filter import CoreUUIDInFilter
from app.workspace.models.subscription import Subscription


class SubscriptionFilter(django_filters.FilterSet):
    """Lọc theo nhóm dịch vụ, chu kỳ gia hạn, trạng thái theo dõi, tự gia hạn và chủ sở hữu."""

    category = CoreChoiceInFilter(
        choices=Subscription.Category.choices,
        help_text="Nhóm dịch vụ (DOMAIN, HOSTING_VPS, SAAS_TOOL...).",
    )
    billing_cycle = CoreChoiceInFilter(
        choices=Subscription.BillingCycle.choices,
        help_text="Chu kỳ gia hạn (WEEKLY, MONTHLY, YEARLY...).",
    )
    is_active = CoreBooleanInFilter(
        help_text="Đang theo dõi (`true`/`false`).",
    )
    auto_renew = CoreBooleanInFilter(
        help_text="Tự động trừ tiền (`true`/`false`).",
    )
    owner = CoreUUIDInFilter(
        field_name="owner_id",
        help_text="ID chủ sở hữu (chỉ áp dụng khi có quyền manage_all).",
    )

    class Meta:
        model = Subscription
        fields = ("category", "billing_cycle", "is_active", "auto_renew", "owner")
