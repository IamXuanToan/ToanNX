"""Bộ lọc cho Giao dịch quyên góp (DonationTransaction)."""

import django_filters

from app.core.filters.core_choice_in_filter import CoreChoiceInFilter
from app.core.filters.core_uuid_in_filter import CoreUUIDInFilter
from app.utilities.models.donation_transaction import DonationTransaction


class DonationTransactionFilter(django_filters.FilterSet):
    """Bộ lọc quyên góp theo trang, bậc, trạng thái và ngày nhận."""

    page_id = CoreUUIDInFilter(field_name="page_id", help_text="ID trang nhận, nhiều giá trị.")
    owner = CoreUUIDInFilter(field_name="owner_id", help_text="ID chủ trang (cho manage_all).")
    tier = CoreChoiceInFilter(choices=DonationTransaction.Tier.choices, help_text="Bậc vinh danh.")
    is_hidden = django_filters.BooleanFilter(help_text="Lọc theo cờ ẩn/hiện.")
    is_censored = django_filters.BooleanFilter(help_text="Lọc theo cờ kiểm duyệt.")
    date_from = django_filters.IsoDateTimeFilter(
        field_name="received_at",
        lookup_expr="gte",
        help_text="Từ ngày nhận.",
    )
    date_to = django_filters.IsoDateTimeFilter(
        field_name="received_at",
        lookup_expr="lte",
        help_text="Đến ngày nhận.",
    )

    class Meta:
        model = DonationTransaction
        fields = ("page_id", "owner", "tier", "is_hidden", "is_censored", "date_from", "date_to")
