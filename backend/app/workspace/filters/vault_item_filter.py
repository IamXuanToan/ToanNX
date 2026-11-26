"""Bộ lọc cho Két sắt Bí mật cá nhân."""

import django_filters

from app.core.filters.core_choice_in_filter import CoreChoiceInFilter
from app.core.filters.core_uuid_in_filter import CoreUUIDInFilter
from app.workspace.models.vault_item import VaultItem


class VaultItemFilter(django_filters.FilterSet):
    """Lọc theo phân loại bí mật và chủ sở hữu."""

    category = CoreChoiceInFilter(
        choices=VaultItem.Category.choices,
        help_text="Phân loại bí mật (SERVER, API_KEY, ACCOUNT...).",
    )
    owner = CoreUUIDInFilter(
        field_name="owner_id",
        help_text="ID chủ sở hữu (chỉ áp dụng khi có quyền manage_all).",
    )

    class Meta:
        model = VaultItem
        fields = ("category", "owner")
