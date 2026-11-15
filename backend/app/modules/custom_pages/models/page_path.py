"""Đường dẫn giữa của trang: `toannx.com/<segment>/<slug>`. Danh mục chung, không có owner."""

from django.db import models
from django.db.models.functions import Lower

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class PagePath(JournalTracker, CoreModel):
    """Một đoạn đường dẫn giữa (ví dụ `qr`, `p`)."""

    segment = models.CharField(
        max_length=32,
        verbose_name="Đoạn đường dẫn",
        help_text="1–32 ký tự a-z, 0-9, '-'; không trùng đoạn dành riêng.",
        db_comment="Đoạn URL giữa",
    )
    name = models.CharField(
        max_length=100, verbose_name="Tên", help_text="Tên hiển thị.", db_comment="Tên đường dẫn giữa"
    )
    description = models.CharField(
        max_length=300, blank=True, verbose_name="Mô tả", help_text="Mô tả ngắn.", db_comment="Mô tả"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Bật",
        help_text="Tắt thì không tạo được trang mới vào đường dẫn này; trang đang có vẫn chạy.",
        db_comment="Cho phép tạo trang mới",
    )
    position = models.PositiveSmallIntegerField(
        default=0, verbose_name="Thứ tự", help_text="Thứ tự trong ô chọn.", db_comment="Thứ tự hiển thị"
    )

    class Meta:
        db_table = "custom_page_path"
        verbose_name = "Đường dẫn giữa"
        verbose_name_plural = "Đường dẫn giữa"
        ordering = ("position", "segment")
        constraints = [
            # Không điều kiện: segment đã xóa không dùng lại (URL cũ có thể đã in ra QR).
            models.UniqueConstraint(Lower("segment"), name="custom_page_path_segment_ci_unique")
        ]

    def __str__(self) -> str:
        """`segment — tên`."""
        return f"{self.segment} — {self.name}"
