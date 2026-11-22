"""Trình duyệt đã bật thông báo (token Firebase Cloud Messaging); token là định danh, không phải bí mật."""

from django.conf import settings
from django.db import models

from app.core.models.core_model import CoreModel


class PushDevice(CoreModel):
    """FCM báo token hết hạn thì tắt; lâu không thấy thì cron xóa."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="push_devices",
        verbose_name="Người dùng",
        help_text="Chủ thiết bị.",
        db_comment="Chủ thiết bị",
    )
    fcm_token = models.CharField(
        max_length=500,
        unique=True,
        verbose_name="Token FCM",
        help_text="Token Firebase của trình duyệt.",
        db_comment="Token FCM",
    )
    label = models.CharField(
        max_length=120,
        blank=True,
        default="",
        verbose_name="Tên",
        help_text="Ví dụ Chrome · Windows.",
        db_comment="Tên thiết bị",
    )
    user_agent = models.CharField(
        max_length=500,
        blank=True,
        default="",
        verbose_name="User agent",
        help_text="User agent lúc đăng ký.",
        db_comment="User agent",
    )
    is_active = models.BooleanField(
        default=True, verbose_name="Đang dùng", help_text="Tắt khi token hết hạn.", db_comment="Đang dùng"
    )
    last_seen_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Thấy lần cuối",
        help_text="Lần cuối FE đăng ký lại.",
        db_comment="Lần cuối thấy",
    )

    class Meta:
        db_table = "system_push_device"
        verbose_name = "Thiết bị nhận thông báo"
        verbose_name_plural = "Thiết bị nhận thông báo"
        ordering = ("-last_seen_at",)

    def __str__(self) -> str:
        """Tên thiết bị."""
        return self.label or self.fcm_token[:16]
