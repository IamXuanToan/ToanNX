"""Mã QR do người dùng tạo; ảnh PNG lưu trong Thư viện (Attachment)."""

from django.conf import settings
from django.db import models

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class QrCode(JournalTracker, CoreModel):
    """Một mã QR: loại, dữ liệu theo loại, kiểu dáng, payload đã mã hóa và ảnh."""

    journal_fields = ("name", "qr_type", "content", "design", "logo")

    class Type(models.TextChoices):
        """Loại nội dung mã QR."""

        BANK_TRANSFER = "BANK_TRANSFER", "Chuyển khoản"
        URL = "URL", "Liên kết"
        TEXT = "TEXT", "Văn bản"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="qr_codes",
        verbose_name="Chủ sở hữu",
        help_text="Người dùng sở hữu mã QR.",
        db_comment="Chủ sở hữu mã QR",
    )
    name = models.CharField(
        max_length=150, verbose_name="Tên", help_text="Tên hiển thị trong quản lý.", db_comment="Tên mã QR"
    )
    qr_type = models.CharField(
        max_length=16,
        choices=Type.choices,
        verbose_name="Loại",
        help_text="BANK_TRANSFER, URL hoặc TEXT.",
        db_comment="Loại mã QR",
    )
    content = models.JSONField(
        verbose_name="Nội dung",
        help_text="Dữ liệu theo loại (đã validate ở service).",
        db_comment="Dữ liệu theo loại",
    )
    design = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Kiểu dáng",
        help_text="Kích thước, màu, lề, mức sửa lỗi.",
        db_comment="Kiểu dáng mã QR",
    )
    payload = models.TextField(
        max_length=2048,
        verbose_name="Payload",
        help_text="Chuỗi được mã hóa vào mã QR (VietQR EMVCo với chuyển khoản).",
        db_comment="Chuỗi mã hóa",
    )
    image = models.ForeignKey(
        "system.Attachment",
        on_delete=models.PROTECT,
        related_name="+",
        verbose_name="Ảnh",
        help_text="Ảnh PNG trong Thư viện; sửa mã QR thay nội dung ảnh, giữ id.",
        db_comment="Ảnh PNG của mã QR",
    )
    logo = models.ForeignKey(
        "system.Attachment",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="qr_codes_as_logo",
        verbose_name="Logo",
        help_text="Ảnh logo ở giữa mã QR; chỉ nhận PNG, JPEG, WebP hoặc GIF.",
        db_comment="Logo tùy chọn của mã QR",
    )

    class Meta:
        db_table = "utilities_qr_code"
        verbose_name = "Mã QR"
        verbose_name_plural = "Mã QR"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(qr_type__in=["BANK_TRANSFER", "URL", "TEXT"]),
                name="utilities_qr_code_type_valid",
            )
        ]
        indexes = [
            models.Index(
                fields=["owner", "-created_at"],
                condition=models.Q(deleted_at__isnull=True),
                name="qr_owner_created_alive_idx",
            )
        ]

    def __str__(self) -> str:
        """Tên mã QR."""
        return self.name
