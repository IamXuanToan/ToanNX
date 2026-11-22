"""Liên kết rút gọn có owner và slug công khai."""

from django.conf import settings
from django.db import models
from django.db.models.functions import Lower

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class ShortLink(JournalTracker, CoreModel):
    """URL ngắn mở trang trung gian trước khi đến đích."""

    journal_masked_fields = ("password_hash",)

    class Status(models.TextChoices):
        """Trạng thái cấu hình; EXPIRED được tính từ expires_at."""

        ACTIVE = "ACTIVE", "Hoạt động"
        INACTIVE = "INACTIVE", "Tạm tắt"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="short_links",
        verbose_name="Chủ sở hữu",
        help_text="Người dùng sở hữu liên kết.",
        db_comment="Chủ sở hữu liên kết",
    )
    name = models.CharField(
        max_length=150, verbose_name="Tên", help_text="Tên hiển thị trong quản lý.", db_comment="Tên liên kết"
    )
    slug = models.CharField(
        max_length=64,
        verbose_name="Slug",
        help_text="Đường dẫn công khai sau /s/.",
        db_comment="Slug URL liên kết",
    )
    destination_url = models.URLField(
        max_length=2048,
        verbose_name="URL đích",
        help_text="URL HTTP/HTTPS tuyệt đối.",
        db_comment="URL chuyển hướng",
    )
    description = models.TextField(
        blank=True,
        max_length=1000,
        verbose_name="Mô tả",
        help_text="Mô tả tùy chọn.",
        db_comment="Mô tả liên kết",
    )
    auto_redirect_seconds = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        verbose_name="Tự chuyển sau",
        help_text="Số giây chờ trước khi trình duyệt mở URL đích; null là chờ người xem bấm.",
        db_comment="Số giây tự chuyển tại trang trung gian",
    )
    password_hash = models.CharField(
        max_length=128,
        blank=True,
        verbose_name="Mã băm mật khẩu",
        help_text="Mã băm mật khẩu bảo vệ liên kết; rỗng là không cần mật khẩu.",
        db_comment="Mã băm mật khẩu liên kết",
    )
    status = models.CharField(
        max_length=8,
        choices=Status.choices,
        default=Status.ACTIVE,
        verbose_name="Trạng thái",
        help_text="ACTIVE cho phép chuyển hướng.",
        db_comment="Trạng thái liên kết",
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Hết hạn",
        help_text="Thời điểm hết hạn, null là không giới hạn.",
        db_comment="Thời điểm hết hạn",
    )

    class Meta:
        db_table = "utilities_short_link"
        verbose_name = "Liên kết rút gọn"
        verbose_name_plural = "Liên kết rút gọn"
        constraints = [
            # Không điều kiện: slug đã xóa không dùng lại (tránh người khác chiếm URL đã in ra).
            models.UniqueConstraint(Lower("slug"), name="utilities_short_link_slug_ci_unique"),
            models.CheckConstraint(
                condition=models.Q(status__in=["ACTIVE", "INACTIVE"]),
                name="utilities_short_link_status_valid",
            ),
            models.CheckConstraint(
                condition=models.Q(auto_redirect_seconds__isnull=True)
                | models.Q(auto_redirect_seconds__gte=1, auto_redirect_seconds__lte=60),
                name="utilities_short_link_auto_seconds_valid",
            ),
        ]
        indexes = [
            models.Index(
                fields=["owner", "-created_at"],
                condition=models.Q(deleted_at__isnull=True),
                name="sl_owner_created_alive_idx",
            )
        ]

    def __str__(self) -> str:
        """Tên link (dùng làm nhãn trong lịch sử thay đổi)."""
        return f"{self.name} (/s/{self.slug})"
