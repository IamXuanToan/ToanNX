"""Outbox: một lần gửi một thông báo qua một kênh tới một đích; unique (notification, channel, target)."""

from django.db import models

from app.core.models.core_model import CoreModel
from app.system.constants.notification_channel import NotificationChannel


class NotificationDelivery(CoreModel):
    """Gửi ngay sau commit trong ngân sách thời gian; phần còn lại do cron gửi và thử lại."""

    class Status(models.TextChoices):
        """Trạng thái gửi."""

        PENDING = "PENDING", "Chờ gửi"
        SENT = "SENT", "Đã gửi"
        FAILED = "FAILED", "Thất bại"
        SKIPPED = "SKIPPED", "Bỏ qua"

    notification = models.ForeignKey(
        "system.Notification",
        on_delete=models.CASCADE,
        related_name="deliveries",
        verbose_name="Thông báo",
        help_text="Thông báo cần gửi.",
        db_comment="Thông báo",
    )
    channel = models.CharField(
        max_length=16,
        choices=NotificationChannel.choices,
        verbose_name="Kênh",
        help_text="PUSH / EMAIL / TELEGRAM.",
        db_comment="Kênh",
    )
    target = models.CharField(
        max_length=255,
        verbose_name="Đích",
        help_text="Id PushDevice, id TelegramChat hoặc email.",
        db_comment="Đích gửi",
    )
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name="Trạng thái",
        help_text="PENDING / SENT / FAILED / SKIPPED.",
        db_comment="Trạng thái",
    )
    attempts = models.PositiveIntegerField(
        default=0, verbose_name="Số lần thử", help_text="Số lần đã thử.", db_comment="Số lần thử"
    )
    next_attempt_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Thử lại lúc",
        help_text="Lần thử kế tiếp.",
        db_comment="Thời điểm thử lại",
    )
    last_error_code = models.CharField(
        max_length=64,
        blank=True,
        default="",
        verbose_name="Lỗi gần nhất",
        help_text="Mã lỗi gần nhất.",
        db_comment="Mã lỗi gần nhất",
    )
    sent_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Gửi lúc",
        help_text="Thời điểm gửi thành công.",
        db_comment="Thời điểm gửi",
    )
    provider_message_id = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Id phía nhà cung cấp",
        help_text="Id tin nhắn trả về.",
        db_comment="Id phía nhà cung cấp",
    )

    class Meta:
        db_table = "system_notification_delivery"
        verbose_name = "Lần gửi thông báo"
        verbose_name_plural = "Lần gửi thông báo"
        ordering = ("-created_at",)
        constraints = (
            models.UniqueConstraint(
                fields=("notification", "channel", "target"), name="uq_notification_delivery_target"
            ),
        )
        indexes = (models.Index(fields=("status", "next_attempt_at"), name="ix_notification_delivery_due"),)

    def __str__(self) -> str:
        """Kênh + đích."""
        return f"{self.channel}:{self.target}"
