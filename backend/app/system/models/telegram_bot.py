"""Bot Telegram riêng của một người (token tạo ở @BotFather, lưu mã hóa bằng SecretCipher)."""

from django.conf import settings
from django.db import models

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class TelegramBot(JournalTracker, CoreModel):
    """Mỗi người tối đa một bot; API không bao giờ trả token, chỉ 4 ký tự cuối."""

    journal_fields = ("username", "is_active")

    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="telegram_bot",
        verbose_name="Chủ bot",
        help_text="Người dùng sở hữu bot.",
        db_comment="Chủ bot",
    )
    token_encrypted = models.TextField(
        verbose_name="Token (mã hóa)", help_text="Token bot đã mã hóa.", db_comment="Token bot đã mã hóa"
    )
    token_last4 = models.CharField(
        max_length=4,
        verbose_name="4 ký tự cuối",
        help_text="Để nhận ra token.",
        db_comment="4 ký tự cuối token",
    )
    bot_id = models.CharField(
        max_length=32,
        blank=True,
        default="",
        verbose_name="Id bot",
        help_text="Id từ getMe.",
        db_comment="Id bot",
    )
    username = models.CharField(
        max_length=64,
        blank=True,
        default="",
        verbose_name="Username",
        help_text="@username của bot.",
        db_comment="Username bot",
    )
    display_name = models.CharField(
        max_length=128, blank=True, default="", verbose_name="Tên", help_text="Tên bot.", db_comment="Tên bot"
    )
    is_active = models.BooleanField(
        default=True, verbose_name="Đang bật", help_text="Tắt để ngừng gửi.", db_comment="Đang bật"
    )
    last_checked_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Kiểm tra lần cuối",
        help_text="Lần cuối getMe.",
        db_comment="Lần cuối kiểm tra",
    )
    last_error_code = models.CharField(
        max_length=64,
        blank=True,
        default="",
        verbose_name="Lỗi gần nhất",
        help_text="Mã lỗi gần nhất.",
        db_comment="Mã lỗi gần nhất",
    )

    class Meta:
        db_table = "system_telegram_bot"
        verbose_name = "Bot Telegram"
        verbose_name_plural = "Bot Telegram"

    def __str__(self) -> str:
        """@username."""
        return f"@{self.username}" if self.username else f"…{self.token_last4}"
