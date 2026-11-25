"""Repository cho tài nguyên Giao dịch quyên góp (DonationTransaction)."""

from datetime import datetime
from typing import Any

from django.db.models import QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.utilities.models.donation_transaction import DonationTransaction


class DonationTransactionRepository(CoreRepository[DonationTransaction]):
    """Truy vấn dữ liệu quyên góp."""

    model = DonationTransaction

    def get_queryset(self) -> QuerySet[DonationTransaction]:
        """Queryset mặc định kèm select_related để chống N+1."""
        return super().get_queryset().select_related("page", "owner")

    def find_by_sepay_id(self, sepay_id: str) -> DonationTransaction | None:
        """Tìm giao dịch theo `sepay_id` (gồm cả bản ghi xóa mềm để chặn trùng khóa)."""
        return self.get_queryset_with_deleted().filter(sepay_id=sepay_id).first()

    def list_public_feed_for_page(
        self, page_id: Any, offset: int, limit: int
    ) -> QuerySet[DonationTransaction]:
        """Danh sách giao dịch công khai hợp lệ theo trang Donate."""
        return self.filter(
            page_id=page_id,
            is_hidden=False,
            is_censored=False,
        ).order_by("-received_at")[offset : offset + limit]

    def list_public_leaderboard_for_page(
        self, page_id: Any, now: datetime, limit: int = 30
    ) -> QuerySet[DonationTransaction]:
        """Bảng vinh danh theo số tiền giảm dần còn hiệu lực."""
        return self.filter(
            page_id=page_id,
            is_hidden=False,
            is_censored=False,
            tier__in=[
                DonationTransaction.Tier.BRONZE,
                DonationTransaction.Tier.SILVER,
                DonationTransaction.Tier.GOLD,
                DonationTransaction.Tier.DIAMOND,
            ],
            tier_expires_at__gt=now,
        ).order_by("-amount", "-received_at")[:limit]
