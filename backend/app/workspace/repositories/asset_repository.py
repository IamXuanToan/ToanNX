"""Repository Thiết bị cá nhân kèm Subquery tổng hợp chi phí & số phiếu bảo hành (0 N+1)."""

from datetime import date
from decimal import Decimal
from typing import Any

from django.db.models import Count, DateField, DecimalField, Max, OuterRef, Q, QuerySet, Subquery, Sum, Value
from django.db.models.functions import Coalesce

from app.core.repositories.core_repository import CoreRepository
from app.workspace.models.asset import Asset
from app.workspace.models.asset_warranty_claim import AssetWarrantyClaim


class AssetRepository(CoreRepository[Asset]):
    """Truy xuất Thiết bị kèm annotation thống kê bảo hành không gây Cartesian join."""

    model = Asset

    def get_queryset(self) -> QuerySet[Asset]:
        """Nạp trước owner, currency, hóa đơn và thống kê phiếu bảo hành qua Subquery."""
        base_claims = AssetWarrantyClaim.objects.filter(asset_id=OuterRef("pk"), deleted_at__isnull=True)
        warranty_count_sq = (
            base_claims.filter(claim_type=AssetWarrantyClaim.ClaimType.WARRANTY)
            .values("asset_id")
            .annotate(total=Count("id"))
            .values("total")[:1]
        )
        repair_count_sq = (
            base_claims.exclude(claim_type=AssetWarrantyClaim.ClaimType.WARRANTY)
            .values("asset_id")
            .annotate(total=Count("id"))
            .values("total")[:1]
        )
        total_count_sq = base_claims.values("asset_id").annotate(total=Count("id")).values("total")[:1]
        open_count_sq = (
            base_claims.filter(
                status__in=(
                    AssetWarrantyClaim.Status.SUBMITTED,
                    AssetWarrantyClaim.Status.INSPECTING,
                    AssetWarrantyClaim.Status.WAITING_PARTS,
                )
            )
            .values("asset_id")
            .annotate(total=Count("id"))
            .values("total")[:1]
        )
        cost_sum_sq = base_claims.values("asset_id").annotate(total=Sum("cost_vnd")).values("total")[:1]
        last_date_sq = (
            base_claims.values("asset_id").annotate(latest=Max("submitted_date")).values("latest")[:1]
        )

        return (
            super()
            .get_queryset()
            .select_related("owner", "currency")
            .prefetch_related("invoice_attachments")
            .annotate(
                warranty_claim_count=Coalesce(Subquery(warranty_count_sq), Value(0)),
                repair_count=Coalesce(Subquery(repair_count_sq), Value(0)),
                total_claim_count=Coalesce(Subquery(total_count_sq), Value(0)),
                open_claim_count=Coalesce(Subquery(open_count_sq), Value(0)),
                total_service_cost_vnd=Coalesce(
                    Subquery(cost_sum_sq),
                    Value(Decimal("0")),
                    output_field=DecimalField(max_digits=18, decimal_places=0),
                ),
                last_claim_date=Subquery(last_date_sq, output_field=DateField()),
            )
        )

    def sum_purchase_vnd(self, owner_id: Any, start_date: date, end_date: date) -> Decimal:
        """Tổng tiền mua thiết bị VNĐ của owner trong khoảng ngày."""
        agg = (
            super()
            .get_queryset()
            .filter(owner_id=owner_id, purchase_date__gte=start_date, purchase_date__lte=end_date)
            .aggregate(total=Coalesce(Sum("purchase_price_vnd"), Value(Decimal("0"))))
        )
        return Decimal(agg["total"])

    def list_with_warranty_between(self, owner_id: Any, start_date: date, end_date: date) -> list[Asset]:
        """Thiết bị có hạn bảo hành rơi vào khoảng ngày."""
        return list(
            self.filter(
                owner_id=owner_id,
                warranty_end_date__isnull=False,
                warranty_end_date__gte=start_date,
                warranty_end_date__lte=end_date,
            )
            .exclude(status__in=(Asset.Status.SOLD, Asset.Status.BROKEN))
            .order_by("warranty_end_date")
        )

    def list_all_warranty_expiring_between(self, start_date: date, end_date: date) -> list[Asset]:
        """Thiết bị còn hiệu lực của mọi owner sắp hết bảo hành trong khoảng ngày (cho cron W4)."""
        return list(
            self.get_queryset()
            .filter(
                warranty_end_date__isnull=False,
                warranty_end_date__gte=start_date,
                warranty_end_date__lte=end_date,
            )
            .exclude(status__in=(Asset.Status.SOLD, Asset.Status.BROKEN))
            .order_by("warranty_end_date")
        )

    def count_expiring_before(self, owner_id: Any, today: date, until_date: date) -> int:
        """Số thiết bị sắp hết bảo hành trong khoảng `[today, until_date]`."""
        return (
            super()
            .get_queryset()
            .filter(
                owner_id=owner_id,
                warranty_end_date__isnull=False,
                warranty_end_date__gte=today,
                warranty_end_date__lte=until_date,
            )
            .exclude(status__in=(Asset.Status.SOLD, Asset.Status.BROKEN))
            .count()
        )

    def search_for_owner(
        self, owner_id: Any, *, query: str = "", status: str = "", limit: int = 15
    ) -> tuple[list[Asset], int]:
        """Tìm nhanh thiết bị của chính owner cho AI Tool (tối đa `limit` mục)."""
        qs = self.get_queryset().filter(owner_id=owner_id)
        if status:
            qs = qs.filter(status=status)
        if query:
            qs = qs.filter(
                Q(name__icontains=query)
                | Q(brand__icontains=query)
                | Q(model_code__icontains=query)
                | Q(serial_number__icontains=query)
                | Q(purchase_store__icontains=query)
            )
        total = qs.count()
        return list(qs.order_by("-created_at")[:limit]), total
