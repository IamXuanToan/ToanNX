"""Thông báo trong chuông của một người nhận (thông báo hệ thống được tách thành từng dòng mỗi người)."""

from django.conf import settings
from django.db import models

from app.core.models.core_model import CoreModel
from app.system.constants.notification_level import NotificationLevel
from app.system.constants.notification_scope import NotificationScope


class Notification(CoreModel):
    """Một dòng trong chuông; trạng thái đã đọc là của riêng người nhận."""

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
        verbose_name="Người nhận",
        help_text="Người nhận thông báo.",
        db_comment="Người nhận",
    )
    scope = models.CharField(
        max_length=16,
        choices=NotificationScope.choices,
        default=NotificationScope.PERSONAL,
        verbose_name="Phạm vi",
        help_text="PERSONAL = tab Cá nhân, SYSTEM = tab Hệ thống.",
        db_comment="PERSONAL | SYSTEM",
    )
    level = models.CharField(
        max_length=16,
        choices=NotificationLevel.choices,
        default=NotificationLevel.INFO,
        verbose_name="Mức",
        help_text="INFO / WARNING / ERROR.",
        db_comment="INFO | WARNING | ERROR",
    )
    event_code = models.CharField(
        max_length=100, verbose_name="Sự kiện", help_text="Mã sự kiện.", db_comment="Mã sự kiện"
    )
    module = models.CharField(
        max_length=50, verbose_name="Module", help_text="Module phát.", db_comment="Module phát"
    )
    title = models.CharField(
        max_length=200,
        verbose_name="Tiêu đề",
        help_text="Tiêu đề dựng sẵn (dùng cho push/email/Telegram và làm dự phòng i18n).",
        db_comment="Tiêu đề",
    )
    body = models.TextField(
        blank=True, default="", verbose_name="Nội dung", help_text="Nội dung ngắn.", db_comment="Nội dung"
    )
    message_key = models.CharField(
        max_length=150,
        blank=True,
        default="",
        verbose_name="Khóa i18n",
        help_text="Khóa thông điệp FE dịch theo ngôn ngữ đang chọn.",
        db_comment="Khóa i18n",
    )
    params = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Tham số",
        help_text="Tham số cho khóa i18n.",
        db_comment="Tham số i18n",
    )
    link = models.CharField(
        max_length=500,
        blank=True,
        default="",
        verbose_name="Đường dẫn",
        help_text="Đường dẫn FE nội bộ (bắt đầu bằng /).",
        db_comment="Đường dẫn FE",
    )
    data = models.JSONField(
        default=dict, blank=True, verbose_name="Dữ liệu", help_text="Dữ liệu phụ.", db_comment="Dữ liệu phụ"
    )
    dedup_key = models.CharField(
        max_length=200,
        verbose_name="Khóa chống trùng",
        help_text="Phát lại không tạo trùng.",
        db_comment="Khóa chống trùng",
    )
    read_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Đã đọc lúc",
        help_text="NULL = chưa đọc.",
        db_comment="Thời điểm đọc",
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Hết hạn",
        help_text="Quá hạn thì ẩn.",
        db_comment="Thời điểm hết hạn",
    )

    class Meta:
        db_table = "system_notification"
        verbose_name = "Thông báo"
        verbose_name_plural = "Thông báo"
        ordering = ("-created_at",)
        constraints = (
            models.UniqueConstraint(
                fields=("recipient", "event_code", "dedup_key"), name="uq_notification_recipient_event_dedup"
            ),
        )
        indexes = (
            models.Index(
                fields=("recipient", "scope", "read_at", "-created_at"), name="ix_notification_bell"
            ),
            models.Index(fields=("recipient", "-created_at"), name="ix_notification_recipient"),
        )

    def __str__(self) -> str:
        """Tiêu đề."""
        return self.title
