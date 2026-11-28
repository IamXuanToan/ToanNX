"""Model Tin nhắn trong hội thoại Trợ lý AI (không dùng JournalTracker để giữ gọn DB)."""

from django.db import models
from django.db.models import Q

from app.core.models.core_model import CoreModel


class AssistantMessage(CoreModel):
    """Lưu từng lượt hỏi đáp, tool_calls và dấu hiệu dữ liệu riêng tư."""

    class Role(models.TextChoices):
        """Vai trò phát ngôn trong hội thoại."""

        USER = "USER", "Người dùng"
        ASSISTANT = "ASSISTANT", "Trợ lý"
        TOOL = "TOOL", "Kết quả Tool"
        SYSTEM = "SYSTEM", "Hệ thống"

    conversation = models.ForeignKey(
        "workspace.AssistantConversation",
        on_delete=models.CASCADE,
        related_name="messages",
        verbose_name="Hội thoại",
        help_text="Phiên trò chuyện chứa tin nhắn.",
        db_comment="Hội thoại cha",
    )
    role = models.CharField(
        max_length=16,
        choices=Role.choices,
        default=Role.USER,
        verbose_name="Vai trò",
        help_text="Người dùng, Trợ lý, Tool hoặc Hệ thống.",
        db_comment="Vai trò tin nhắn",
    )
    sender_telegram_id = models.BigIntegerField(
        null=True,
        blank=True,
        verbose_name="Telegram User ID người gửi",
        help_text="ID người nhắn trên Telegram.",
        db_comment="Telegram sender ID",
    )
    sender_name = models.CharField(
        max_length=150,
        blank=True,
        default="",
        verbose_name="Tên người gửi",
        help_text="Tên hiển thị người gửi.",
        db_comment="Tên người gửi",
    )
    content = models.TextField(
        blank=True,
        default="",
        verbose_name="Nội dung",
        help_text="Nội dung văn bản tin nhắn.",
        db_comment="Nội dung tin nhắn",
    )
    tool_calls = models.JSONField(
        null=True,
        blank=True,
        verbose_name="Lời gọi Tool",
        help_text="Danh sách tool calls OpenAI JSON (nếu có).",
        db_comment="Tool calls JSON",
    )
    tool_call_id = models.CharField(
        max_length=100,
        blank=True,
        default="",
        verbose_name="Tool Call ID",
        help_text="Mã ánh xạ kết quả trả về cho LLM.",
        db_comment="Tool call id",
    )
    model_used = models.CharField(
        max_length=120,
        blank=True,
        default="",
        verbose_name="Model AI đã dùng",
        help_text="Tên model thực sự phản hồi (hoặc slash).",
        db_comment="Model AI sử dụng",
    )
    tokens_used = models.PositiveIntegerField(
        default=0,
        verbose_name="Số token tiêu thụ",
        help_text="Tổng token ghi nhận cho lượt này.",
        db_comment="Số token tiêu thụ",
    )
    contains_private_data = models.BooleanField(
        default=False,
        verbose_name="Chứa dữ liệu riêng tư",
        help_text="Đánh dấu lượt hỏi có truy vấn dữ liệu cá nhân để lọc khi trả lời nhóm.",
        db_comment="Chứa dữ liệu riêng tư",
    )
    is_error = models.BooleanField(
        default=False,
        verbose_name="Phản hồi lỗi / Fallback",
        help_text="True nếu lượt này gặp lỗi LLM hoặc rơi về Slash fallback.",
        db_comment="Cờ lỗi fallback",
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Dữ liệu hiển thị kèm",
        help_text="Nút trả lời nhanh (`quick_replies`) và thẻ kết quả (`cards`) server dựng từ kết quả tool.",
        db_comment="Quick replies và thẻ kết quả của tin nhắn",
    )

    class Meta:
        db_table = "workspace_assistant_message"
        indexes = (
            models.Index(
                fields=("conversation", "created_at"),
                condition=Q(deleted_at__isnull=True),
                name="idx_ws_msg_conv_created",
            ),
        )
        verbose_name = "Tin nhắn Trợ lý AI"
        verbose_name_plural = "Tin nhắn Trợ lý AI"

    def __str__(self) -> str:
        """Tóm tắt tin nhắn."""
        return f"{self.role}: {self.content[:40]}"
