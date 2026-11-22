"""Thông báo quản trị viên gửi tới mọi người hoặc theo vai trò (tab Hệ thống của chuông)."""

from django.db import models

from app.core.models.core_model import CoreModel
from app.system.constants.notification_level import NotificationLevel


class SystemAnnouncement(CoreModel):
    """Tạo = gửi ngay; xóa = thu hồi (xóa các thông báo đã tách cho từng người)."""

    class Target(models.TextChoices):
        """Đối tượng nhận."""

        ALL = "ALL", "Mọi người"
        ROLES = "ROLES", "Theo vai trò"

    title = models.CharField(
        max_length=200, verbose_name="Tiêu đề", help_text="Tiêu đề.", db_comment="Tiêu đề"
    )
    body = models.TextField(
        blank=True, default="", verbose_name="Nội dung", help_text="Nội dung.", db_comment="Nội dung"
    )
    level = models.CharField(
        max_length=16,
        choices=NotificationLevel.choices,
        default=NotificationLevel.INFO,
        verbose_name="Mức",
        help_text="Mức.",
        db_comment="Mức",
    )
    link = models.CharField(
        max_length=500,
        blank=True,
        default="",
        verbose_name="Đường dẫn",
        help_text="Đường dẫn FE nội bộ.",
        db_comment="Đường dẫn",
    )
    target = models.CharField(
        max_length=16,
        choices=Target.choices,
        default=Target.ALL,
        verbose_name="Đối tượng",
        help_text="ALL / ROLES.",
        db_comment="Đối tượng",
    )
    roles = models.ManyToManyField(
        "system.Role",
        blank=True,
        related_name="announcements",
        verbose_name="Vai trò",
        help_text="Vai trò nhận (khi ROLES).",
    )
    expires_at = models.DateTimeField(
        null=True, blank=True, verbose_name="Hết hạn", help_text="Quá hạn thì ẩn.", db_comment="Hết hạn"
    )
    sent_at = models.DateTimeField(
        null=True, blank=True, verbose_name="Gửi lúc", help_text="Thời điểm gửi.", db_comment="Thời điểm gửi"
    )
    recipient_count = models.PositiveIntegerField(
        default=0, verbose_name="Số người nhận", help_text="Số người nhận.", db_comment="Số người nhận"
    )

    class Meta:
        db_table = "system_announcement"
        verbose_name = "Thông báo hệ thống"
        verbose_name_plural = "Thông báo hệ thống"
        ordering = ("-created_at",)

    def __str__(self) -> str:
        """Tiêu đề."""
        return self.title
