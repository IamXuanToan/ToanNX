"""Repository cho tài nguyên Giao dịch quyên góp (DonationTransaction)."""

from django.db.models import QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.utilities.models.donation_transaction import DonationTransaction


class DonationTransactionRepository(CoreRepository[DonationTransaction]):
    """Truy vấn dữ liệu quyên góp."""

    model = DonationTransaction

    def get_queryset(self) -> QuerySet[DonationTransaction]:
        """Queryset mặc định kèm select_related để chống N+1."""
        return super().get_queryset().select_related("page", "owner")
