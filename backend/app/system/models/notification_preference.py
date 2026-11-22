"""Tùy chọn nhận thông báo của một người: bật/tắt sự kiện × kênh (không có dòng = mặc định của sự kiện)."""

from django.conf import settings
from django.db import models

from app.core.models.core_model import CoreModel
from app.system.constants.notification_channel import NotificationChannel


class NotificationPreference(CoreModel):
    """Một ô trong bảng tùy chọn; kênh Telegram thì mỗi chat một dòng."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notification_preferences",
        verbose_name="Người dùng",
        help_text="Chủ tùy chọn.",
        db_comment="Chủ tùy chọn",
    )
    event_code = models.CharField(
        max_length=100, verbose_name="Sự kiện", help_text="Mã sự kiện.", db_comment="Mã sự kiện"
    )
    channel = models.CharField(
        max_length=16,
        choices=NotificationChannel.choices,
        verbose_name="Kênh",
        help_text="IN_APP / PUSH / EMAIL / TELEGRAM.",
        db_comment="Kênh",
    )
    telegram_chat = models.ForeignKey(
        "system.TelegramChat",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="preferences",
        verbose_name="Chat Telegram",
        help_text="Bắt buộc khi kênh TELEGRAM; phải thuộc người dùng.",
        db_comment="Chat Telegram (kênh TELEGRAM)",
    )
    is_enabled = models.BooleanField(default=True, verbose_name="Bật", help_text="Bật/tắt.", db_comment="Bật")

    class Meta:
        db_table = "system_notification_preference"
        verbose_name = "Tùy chọn thông báo"
        verbose_name_plural = "Tùy chọn thông báo"
        constraints = (
            models.UniqueConstraint(
                fields=("user", "event_code", "channel", "telegram_chat"),
                name="uq_notification_preference",
                nulls_distinct=False,
            ),
        )

    def __str__(self) -> str:
        """Sự kiện + kênh."""
        return f"{self.event_code}:{self.channel}"
