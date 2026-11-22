"""Một mốc trong lịch sử khấu trừ thuế của nền tảng: từ ngày `effective_from` (giờ VN) tới mốc kế tiếp."""

from django.db import models

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class PlatformTaxRate(JournalTracker, CoreModel):
    """Đổi % giữa năm = thêm mốc mới; giao dịch cũ giữ % đã chụp."""

    platform = models.ForeignKey(
        "finance.Platform",
        on_delete=models.CASCADE,
        related_name="tax_rates",
        verbose_name="Nền tảng",
        help_text="Nền tảng.",
        db_comment="Nền tảng",
    )
    effective_from = models.DateField(
        verbose_name="Áp dụng từ", help_text="Ngày bắt đầu (giờ Việt Nam).", db_comment="Ngày bắt đầu"
    )
    tax_withheld = models.BooleanField(
        default=False,
        verbose_name="Đã khấu trừ thuế",
        help_text="Nền tảng khấu trừ thuế trước khi trả.",
        db_comment="Khấu trừ trước khi trả",
    )
    rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        verbose_name="Tỷ lệ (%)",
        help_text="0 < rate < 100 khi khấu trừ.",
        db_comment="Tỷ lệ khấu trừ (phần trăm)",
    )
    note = models.TextField(
        blank=True, default="", verbose_name="Ghi chú", help_text="Ghi chú.", db_comment="Ghi chú"
    )

    class Meta:
        db_table = "finance_platform_tax_rate"
        verbose_name = "Mốc khấu trừ thuế"
        verbose_name_plural = "Lịch sử khấu trừ thuế"
        ordering = ("-effective_from",)
        constraints = (
            models.UniqueConstraint(
                fields=("platform", "effective_from"),
                condition=models.Q(deleted_at__isnull=True),
                name="uq_finance_tax_rate_platform_date",
            ),
        )

    def __str__(self) -> str:
        """Ngày + %."""
        return f"{self.effective_from}: {self.rate}%"
