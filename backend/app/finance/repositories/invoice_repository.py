"""Repository Invoice."""

from typing import Any

from django.db.models import Prefetch, QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.finance.models.income import Income
from app.finance.models.invoice import Invoice
from app.system.models.attachment import Attachment


class InvoiceRepository(CoreRepository[Invoice]):
    """Truy cập dữ liệu Invoice."""

    model = Invoice

    def get_queryset(self) -> QuerySet[Invoice]:
        """Kèm nền tảng, tiền tệ, file, giao dịch chưa xóa."""
        attachments: QuerySet[Attachment] = Attachment.objects.select_related("created_by", "folder")
        return (
            super()
            .get_queryset()
            .select_related("platform", "currency")
            .prefetch_related(
                Prefetch("attachments", queryset=attachments),
                Prefetch(
                    "incomes",
                    queryset=Income.objects.filter(deleted_at__isnull=True).select_related("currency"),
                ),
            )
        )

    def set_attachments(self, invoice: Invoice, attachments: list[Any]) -> None:
        """Đồng bộ file chứng từ."""
        invoice.attachments.set(attachments)

    def set_incomes(self, invoice: Invoice, incomes: list[Any]) -> None:
        """Đồng bộ giao dịch gắn."""
        invoice.incomes.set(incomes)

    def exists_number(
        self, owner_id: Any, doc_type: str, issuer: str, number: str, exclude_id: Any = None
    ) -> bool:
        """Đã có chứng từ cùng loại + bên phát hành + số."""
        queryset = self.get_queryset().filter(
            owner_id=owner_id, doc_type=doc_type, issuer__iexact=issuer, number__iexact=number
        )
        if exclude_id is not None:
            queryset = queryset.exclude(pk=exclude_id)
        return queryset.exists()
