"""Tỷ giá: số VNĐ cho 1 đơn vị ngoại tệ theo ngày và nguồn (đệm API + nhập tay)."""

from django.db import models

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class ExchangeRate(JournalTracker, CoreModel):
    """Dòng lấy từ API chỉ đọc (lấy lại được); dòng MANUAL sửa/xóa được."""

    class Source(models.TextChoices):
        """Nguồn tỷ giá."""

        VIETCOMBANK_TRANSFER_BUY = "VIETCOMBANK_TRANSFER_BUY", "Vietcombank · mua chuyển khoản"
        MANUAL = "MANUAL", "Nhập tay"

    currency = models.ForeignKey(
        "system.Currency",
        on_delete=models.PROTECT,
        related_name="rates",
        verbose_name="Tiền tệ",
        help_text="Ngoại tệ (không có dòng cho tiền tệ gốc).",
        db_comment="Tiền tệ",
    )
    rate_date = models.DateField(verbose_name="Ngày", help_text="Ngày công bố.", db_comment="Ngày công bố")
    rate = models.DecimalField(
        max_digits=18,
        decimal_places=6,
        verbose_name="Tỷ giá",
        help_text="Số VNĐ cho 1 đơn vị.",
        db_comment="Số VNĐ cho 1 đơn vị",
    )
    source = models.CharField(
        max_length=32,
        choices=Source.choices,
        verbose_name="Nguồn",
        help_text="Nguồn tỷ giá.",
        db_comment="Nguồn",
    )
    fetched_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Lấy lúc",
        help_text="Thời điểm lấy từ API.",
        db_comment="Thời điểm lấy từ API",
    )
    note = models.TextField(
        blank=True, default="", verbose_name="Ghi chú", help_text="Ghi chú.", db_comment="Ghi chú"
    )

    class Meta:
        db_table = "system_exchange_rate"
        verbose_name = "Tỷ giá"
        verbose_name_plural = "Tỷ giá"
        ordering = ("-rate_date", "currency__code")
        constraints = (
            models.UniqueConstraint(
                fields=("currency", "rate_date", "source"),
                condition=models.Q(deleted_at__isnull=True),
                name="uq_exchange_rate_currency_date_source",
            ),
        )

    def __str__(self) -> str:
        """Mã tiền tệ + ngày."""
        return f"{self.currency_id}@{self.rate_date}"
