"""Nghiệp vụ Tổng hợp Chi tiêu cá nhân (Gia hạn dịch vụ + Mua thiết bị + Bảo hành/Sửa chữa)."""

import calendar
from datetime import date
from decimal import Decimal
from typing import Any

from app.core.constants.defaults import DEFAULT_TIMEZONE
from app.workspace.repositories.asset_repository import AssetRepository
from app.workspace.repositories.asset_warranty_claim_repository import AssetWarrantyClaimRepository
from app.workspace.repositories.subscription_payment_repository import SubscriptionPaymentRepository
from app.workspace.repositories.subscription_repository import SubscriptionRepository
from app.workspace.services.workspace_timezone_service import WorkspaceTimezoneService


class WorkspaceSpendingService:
    """Thống kê chi tiêu cá nhân trong tháng (luôn lọc đúng `owner_id`)."""

    def __init__(
        self,
        asset_repository: AssetRepository | None = None,
        claim_repository: AssetWarrantyClaimRepository | None = None,
        payment_repository: SubscriptionPaymentRepository | None = None,
        subscription_repository: SubscriptionRepository | None = None,
        tz_service: WorkspaceTimezoneService | None = None,
    ) -> None:
        """Khởi tạo các repository chi tiêu và dịch vụ múi giờ."""
        self.asset_repository = asset_repository or AssetRepository()
        self.claim_repository = claim_repository or AssetWarrantyClaimRepository()
        self.payment_repository = payment_repository or SubscriptionPaymentRepository()
        self.subscription_repository = subscription_repository or SubscriptionRepository()
        self.tz_service = tz_service or WorkspaceTimezoneService()

    def summary(
        self,
        actor: Any,
        *,
        month: int | None = None,
        year: int | None = None,
        owner: Any | None = None,
    ) -> dict[str, Any]:
        """Tổng hợp chi tiêu thực tế + dự kiến gia hạn theo tháng cho `owner` (mặc định `actor`)."""
        target_owner = owner or actor
        today_local = self.tz_service.local_today(DEFAULT_TIMEZONE)
        target_year = int(year or today_local.year)
        target_month = int(month or today_local.month)
        last_day = calendar.monthrange(target_year, target_month)[1]
        start_date = date(target_year, target_month, 1)
        end_date = date(target_year, target_month, last_day)

        sub_paid = self.payment_repository.sum_paid_vnd(target_owner.pk, start_date, end_date)
        asset_spent = self.asset_repository.sum_purchase_vnd(target_owner.pk, start_date, end_date)
        warranty_spent = self.claim_repository.sum_cost_vnd(target_owner.pk, start_date, end_date)

        projected = Decimal("0")
        if end_date >= today_local:
            proj_start = max(today_local, start_date)
            projected = self.subscription_repository.sum_projected_vnd(target_owner.pk, proj_start, end_date)

        total_spent = sub_paid + asset_spent + warranty_spent
        return {
            "year": target_year,
            "month": target_month,
            "subscription_paid_vnd": sub_paid,
            "asset_purchase_vnd": asset_spent,
            "warranty_repair_vnd": warranty_spent,
            "projected_subscriptions_vnd": projected,
            "total_spent_vnd": total_spent,
        }
