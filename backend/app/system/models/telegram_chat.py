"""Nhóm/chat Telegram nhận thông báo của một người (đăng ký bằng bot riêng, xác minh qua getUpdates)."""

from django.conf import settings
from django.db import models

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class TelegramChat(JournalTracker, CoreModel):
    """Đăng ký: tạo mã 10 phút → thêm bot vào nhóm qua link `startgroup` → Kiểm tra → lưu chat id thật."""

    journal_fields = ("title", "status", "is_active")

    class Status(models.TextChoices):
        """Trạng thái."""

        PENDING = "pending", "Chờ thêm bot"
        ACTIVE = "active", "Hoạt động"
        UNREACHABLE = "unreachable", "Không gửi được"
        REMOVED = "removed", "Bot đã bị xóa"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="telegram_chats",
        verbose_name="Chủ",
        help_text="Người dùng sở hữu nơi nhận.",
        db_comment="Chủ nơi nhận",
    )
    bot = models.ForeignKey(
        "system.TelegramBot",
        on_delete=models.CASCADE,
        related_name="chats",
        verbose_name="Bot",
        help_text="Bot dùng để gửi vào chat này.",
        db_comment="Bot gửi",
    )
    chat_id = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        verbose_name="Chat id",
        help_text="Id chat Telegram (có sau khi xác minh).",
        db_comment="Id chat Telegram",
    )
    title = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Tên",
        help_text="Tên nhóm.",
        db_comment="Tên nhóm",
    )
    chat_type = models.CharField(
        max_length=32,
        blank=True,
        default="",
        verbose_name="Loại",
        help_text="group/supergroup/private.",
        db_comment="Loại chat",
    )
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name="Trạng thái",
        help_text="Trạng thái.",
        db_comment="pending | active | unreachable | removed",
    )
    is_active = models.BooleanField(
        default=True, verbose_name="Đang bật", help_text="Tắt để ngừng gửi.", db_comment="Đang bật"
    )
    registration_code = models.CharField(
        max_length=32,
        unique=True,
        null=True,
        blank=True,
        verbose_name="Mã đăng ký",
        help_text="Mã gửi kèm /start.",
        db_comment="Mã đăng ký",
    )
    registration_expires_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Mã hết hạn",
        help_text="Hạn mã đăng ký.",
        db_comment="Hạn mã đăng ký",
    )
    last_verified_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Xác minh lần cuối",
        help_text="Lần cuối xác minh.",
        db_comment="Lần cuối xác minh",
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
        db_table = "system_telegram_chat"
        constraints = (
            models.UniqueConstraint(
                fields=("bot", "chat_id"),
                condition=models.Q(chat_id__isnull=False, deleted_at__isnull=True),
                name="uq_telegram_chat_bot_chat",
            ),
        )
        verbose_name = "Nhóm Telegram"
        verbose_name_plural = "Nhóm Telegram"

    def __str__(self) -> str:
        """Tên nhóm."""
        return self.title or str(self.chat_id or self.registration_code)
