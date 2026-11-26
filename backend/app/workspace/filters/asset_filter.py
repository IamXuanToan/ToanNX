"""Bộ lọc cho tài nguyên Thiết bị cá nhân."""

import django_filters

from app.core.filters.core_choice_in_filter import CoreChoiceInFilter
from app.core.filters.core_uuid_in_filter import CoreUUIDInFilter
from app.workspace.models.asset import Asset


class AssetFilter(django_filters.FilterSet):
    """Lọc nhiều giá trị theo loại, trạng thái, bảo hành, kênh mua và chủ sở hữu."""

    category = CoreChoiceInFilter(
        choices=Asset.Category.choices,
        help_text="Nhóm thiết bị (nhiều giá trị phân tách dấu phẩy).",
    )
    status = CoreChoiceInFilter(
        choices=Asset.Status.choices,
        help_text="Trạng thái thiết bị (nhiều giá trị phân tách dấu phẩy).",
    )
    warranty_type = CoreChoiceInFilter(
        choices=Asset.WarrantyType.choices,
        help_text="Loại bảo hành (nhiều giá trị phân tách dấu phẩy).",
    )
    purchase_channel = CoreChoiceInFilter(
        choices=Asset.PurchaseChannel.choices,
        help_text="Kênh mua hàng (nhiều giá trị phân tách dấu phẩy).",
    )
    owner = CoreUUIDInFilter(
        field_name="owner_id",
        help_text="ID chủ sở hữu (chỉ áp dụng khi có quyền manage_all).",
    )

    class Meta:
        model = Asset
        fields = ("category", "status", "warranty_type", "purchase_channel", "owner")
