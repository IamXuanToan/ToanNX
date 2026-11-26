"""Repository Phiếu Bảo hành & Sửa chữa thiết bị."""

from datetime import date
from decimal import Decimal
from typing import Any

from django.db.models import Q, QuerySet, Sum, Value
from django.db.models.functions import Coalesce

from app.core.repositories.core_repository import CoreRepository
from app.workspace.models.asset_warranty_claim import AssetWarrantyClaim

OPEN_STATUSES = (
    AssetWarrantyClaim.Status.SUBMITTED,
    AssetWarrantyClaim.Status.INSPECTING,
    AssetWarrantyClaim.Status.WAITING_PARTS,
)


class AssetWarrantyClaimRepository(CoreRepository[AssetWarrantyClaim]):
    """Truy xuất phiếu bảo hành kèm thiết bị, tiền tệ và tệp chứng từ."""

    model = AssetWarrantyClaim

    def get_queryset(self) -> QuerySet[AssetWarrantyClaim]:
        """Nạp trước quan hệ để không phát sinh N+1."""
        return (
            super()
            .get_queryset()
            .select_related("owner", "asset", "currency")
            .prefetch_related("attachments")
        )

    def has_open_claim_for_asset(self, asset_id: Any, *, exclude_pk: Any | None = None) -> bool:
        """Kiểm tra thiết bị còn phiếu nào đang mở hay không."""
        qs = super().get_queryset().filter(asset_id=asset_id, status__in=OPEN_STATUSES)
        if exclude_pk is not None:
            qs = qs.exclude(pk=exclude_pk)
        return qs.exists()

    def count_with_code_prefix(self, owner_id: Any, prefix: str) -> int:
        """Đếm số phiếu mang tiền tố `BH-YYYYMM-` (cả bản xóa mềm để giữ số tăng đều)."""
        return (
            self.get_queryset_with_deleted().filter(owner_id=owner_id, claim_code__startswith=prefix).count()
        )

    def sum_cost_vnd(self, owner_id: Any, start_date: date, end_date: date) -> Decimal:
        """Tổng chi phí sửa chữa/bảo hành VNĐ phát sinh trong khoảng ngày."""
        agg = (
            super()
            .get_queryset()
            .filter(owner_id=owner_id, submitted_date__gte=start_date, submitted_date__lte=end_date)
            .aggregate(total=Coalesce(Sum("cost_vnd"), Value(Decimal("0"))))
        )
        return Decimal(agg["total"])

    def list_calendar_events(
        self, owner_id: Any, start_date: date, end_date: date
    ) -> list[AssetWarrantyClaim]:
        """Phiếu bảo hành có mốc hẹn trả hoặc hạn BH linh kiện rơi vào khoảng lịch."""
        return list(
            self.get_queryset()
            .filter(owner_id=owner_id)
            .filter(
                Q(estimated_return_date__gte=start_date, estimated_return_date__lte=end_date)
                | Q(part_warranty_end_date__gte=start_date, part_warranty_end_date__lte=end_date)
            )
            .order_by("estimated_return_date", "part_warranty_end_date")
        )
