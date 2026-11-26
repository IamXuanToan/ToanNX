"""Nền tảng trả tiền (Facebook, YouTube, Làm tự do...) của một người; thuế nằm ở lịch sử `PlatformTaxRate`."""

from django.conf import settings
from django.core.validators import RegexValidator
from django.db import models

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker

HEX_COLOR_VALIDATOR = RegexValidator(
    regex=r"^(#[0-9A-Fa-f]{6})?$",
    message="Mã màu HEX phải có dạng #RRGGBB.",
)


class Platform(JournalTracker, CoreModel):
    """Không chứa field thuế: "khấu trừ hiện tại" là mốc mới nhất có hiệu lực hôm nay."""

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="finance_platforms",
        verbose_name="Chủ",
        help_text="Người dùng sở hữu.",
        db_comment="Chủ",
    )
    name = models.CharField(max_length=150, verbose_name="Tên", help_text="Tên nền tảng.", db_comment="Tên")
    code = models.SlugField(
        max_length=50, verbose_name="Mã", help_text="Mã ngắn, duy nhất theo người dùng.", db_comment="Mã"
    )
    default_currency = models.ForeignKey(
        "system.Currency",
        on_delete=models.PROTECT,
        related_name="finance_platforms",
        verbose_name="Tiền tệ mặc định",
        help_text="Điền sẵn khi nhập tay.",
        db_comment="Tiền tệ mặc định",
    )
    is_active = models.BooleanField(
        default=True, verbose_name="Đang dùng", help_text="Tắt để ẩn khỏi chọn mới.", db_comment="Đang dùng"
    )
    color = models.CharField(
        max_length=7,
        blank=True,
        default="",
        validators=[HEX_COLOR_VALIDATOR],
        verbose_name="Màu biểu đồ",
        help_text="Mã màu HEX (#RRGGBB) hiển thị trên biểu đồ.",
        db_comment="Màu biểu đồ",
    )
    note = models.TextField(
        blank=True, default="", verbose_name="Ghi chú", help_text="Ghi chú.", db_comment="Ghi chú"
    )

    class Meta:
        db_table = "finance_platform"
        verbose_name = "Nền tảng"
        verbose_name_plural = "Nền tảng"
        ordering = ("name",)
        constraints = (
            models.UniqueConstraint(fields=("owner", "code"), name="uq_finance_platform_owner_code"),
        )

    def __str__(self) -> str:
        """Tên nền tảng."""
        return self.name
