"""Model Phiên hội thoại Trợ lý AI (Web Portal, Telegram DM, Telegram Group)."""

from django.conf import settings
from django.db import models
from django.db.models import Q

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class AssistantConversation(JournalTracker, CoreModel):
    """Lưu lịch sử hội thoại trợ lý AI theo từng kênh tương tác."""

    journal_fields = ("channel", "title", "last_message_at")

    class Channel(models.TextChoices):
        """Kênh trò chuyện với trợ lý AI."""

        WEB = "WEB", "Giao diện Web"
        TELEGRAM_DM = "TELEGRAM_DM", "Telegram Riêng"
        TELEGRAM_GROUP = "TELEGRAM_GROUP", "Telegram Nhóm"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workspace_assistant_conversations",
        verbose_name="Chủ sở hữu",
        help_text="Người sở hữu hội thoại.",
        db_comment="Chủ sở hữu hội thoại",
    )
    channel = models.CharField(
        max_length=20,
        choices=Channel.choices,
        default=Channel.WEB,
        verbose_name="Kênh tương tác",
        help_text="Nơi diễn ra cuộc trò chuyện.",
        db_comment="Kênh trò chuyện",
    )
    external_chat_id = models.CharField(
        max_length=64,
        blank=True,
        default="",
        db_index=True,
        verbose_name="ID chat ngoài",
        help_text="Chat ID trên Telegram (nếu là kênh Telegram).",
        db_comment="Chat ID ngoài",
    )
    title = models.CharField(
        max_length=200,
        blank=True,
        default="",
        verbose_name="Tiêu đề",
        help_text="Tiêu đề tóm tắt của phiên trò chuyện.",
        db_comment="Tiêu đề hội thoại",
    )
    last_message_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Tin nhắn cuối lúc",
        help_text="Thời điểm có tin nhắn mới nhất.",
        db_comment="Thời điểm tin nhắn cuối",
    )
    pending_action = models.JSONField(
        null=True,
        blank=True,
        verbose_name="Hành động đang chờ",
        help_text="Nháp tạo mới hoặc yêu cầu xóa chờ người dùng chọn ở lượt sau (không chứa mật khẩu).",
        db_comment="Hành động Trợ lý AI đang chờ xác nhận",
    )
    pending_expires_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Hạn hành động chờ",
        help_text="Quá thời điểm này thì hành động đang chờ bị bỏ.",
        db_comment="Thời điểm hết hạn hành động đang chờ",
    )

    class Meta:
        db_table = "workspace_assistant_conversation"
        indexes = (
            models.Index(
                fields=("owner", "channel", "external_chat_id"),
                condition=Q(deleted_at__isnull=True),
                name="idx_ws_conv_owner_chan_ext",
            ),
        )
        verbose_name = "Hội thoại Trợ lý AI"
        verbose_name_plural = "Hội thoại Trợ lý AI"

    def __str__(self) -> str:
        """Tiêu đề hội thoại."""
        return self.title or f"{self.channel} ({self.pk})"
