"""Repository mã QR."""

from django.db.models import QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.utilities.models.qr_code import QrCode


class QrCodeRepository(CoreRepository[QrCode]):
    """Mã QR chưa xóa mềm, kèm ảnh và owner (không N+1)."""

    model = QrCode

    def get_queryset(self) -> QuerySet[QrCode]:
        """Chỉ mã QR còn tồn tại."""
        return super().get_queryset().select_related("image", "logo", "owner")
