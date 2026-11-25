"""Bộ lọc nền tảng."""

import django_filters

from app.core.filters.core_boolean_in_filter import CoreBooleanInFilter
from app.core.filters.core_uuid_in_filter import CoreUUIDInFilter
from app.finance.models.platform import Platform


class PlatformFilter(django_filters.FilterSet):
    """Đang dùng, người dùng sở hữu."""

    owner = CoreUUIDInFilter(field_name="owner_id", help_text="Người dùng sở hữu; nhiều giá trị.")
    is_active = CoreBooleanInFilter(help_text="Đang dùng.")

    class Meta:
        model = Platform
        fields = ("owner", "is_active")
