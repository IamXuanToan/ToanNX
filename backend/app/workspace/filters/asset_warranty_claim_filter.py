"""Bộ lọc cho Phiếu bảo hành & Sửa chữa thiết bị."""

import django_filters

from app.core.filters.core_boolean_in_filter import CoreBooleanInFilter
from app.core.filters.core_choice_in_filter import CoreChoiceInFilter
from app.core.filters.core_uuid_in_filter import CoreUUIDInFilter
from app.workspace.models.asset_warranty_claim import AssetWarrantyClaim


class AssetWarrantyClaimFilter(django_filters.FilterSet):
    """Lọc theo thiết bị, loại phiếu, trạng thái, miễn phí bảo hành và chủ sở hữu."""

    asset = CoreUUIDInFilter(
        field_name="asset_id",
        help_text="ID thiết bị (nhiều giá trị phân tách dấu phẩy).",
    )
    claim_type = CoreChoiceInFilter(
        choices=AssetWarrantyClaim.ClaimType.choices,
        help_text="Loại phiếu (WARRANTY, PAID_REPAIR, MAINTENANCE).",
    )
    status = CoreChoiceInFilter(
        choices=AssetWarrantyClaim.Status.choices,
        help_text="Trạng thái phiếu (nhiều giá trị phân tách dấu phẩy).",
    )
    is_covered_by_warranty = CoreBooleanInFilter(
        help_text="Được bảo hành miễn phí (`true`/`false`).",
    )
    owner = CoreUUIDInFilter(
        field_name="owner_id",
        help_text="ID chủ sở hữu (chỉ áp dụng khi có quyền manage_all).",
    )

    class Meta:
        model = AssetWarrantyClaim
        fields = ("asset", "claim_type", "status", "is_covered_by_warranty", "owner")
