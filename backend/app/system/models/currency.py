"""Tiền tệ dùng chung (VND là tiền tệ gốc, mọi tổng quy về VND)."""

from django.db import models

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class Currency(JournalTracker, CoreModel):
    """Đúng một tiền tệ gốc (`is_base`) không đổi mã, không tắt, không xóa."""

    code = models.CharField(
        max_length=3,
        unique=True,
        verbose_name="Mã",
        help_text="ISO 4217, ví dụ VND, USD.",
        db_comment="Mã ISO 4217",
    )
    name = models.CharField(max_length=100, verbose_name="Tên", help_text="Tên tiền tệ.", db_comment="Tên")
    symbol = models.CharField(
        max_length=10, verbose_name="Ký hiệu", help_text="Ví dụ ₫, $.", db_comment="Ký hiệu"
    )
    decimal_places = models.PositiveSmallIntegerField(
        default=2,
        verbose_name="Số lẻ",
        help_text="Số chữ số thập phân của số tiền gốc (0–4).",
        db_comment="Số chữ số thập phân",
    )
    is_base = models.BooleanField(
        default=False,
        verbose_name="Tiền tệ gốc",
        help_text="Tiền tệ quy đổi về (VND).",
        db_comment="Tiền tệ gốc",
    )
    is_active = models.BooleanField(
        default=True, verbose_name="Đang dùng", help_text="Tắt để ẩn khỏi chọn mới.", db_comment="Đang dùng"
    )
    position = models.PositiveIntegerField(
        default=0, verbose_name="Thứ tự", help_text="Thứ tự hiển thị.", db_comment="Thứ tự"
    )

    class Meta:
        db_table = "system_currency"
        verbose_name = "Tiền tệ"
        verbose_name_plural = "Tiền tệ"
        ordering = ("position", "code")
        constraints = (
            models.UniqueConstraint(
                fields=("is_base",),
                condition=models.Q(is_base=True, deleted_at__isnull=True),
                name="uq_currency_single_base",
            ),
        )

    def __str__(self) -> str:
        """Mã tiền tệ."""
        return self.code
