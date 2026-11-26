"""Model Nhắc việc cá nhân (hỗ trợ lặp định kỳ với anchor_day)."""

from django.conf import settings
from django.db import models
from django.db.models import Q

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class Reminder(JournalTracker, CoreModel):
    """Công việc cần làm / nhắc hẹn theo múi giờ người dùng."""

    journal_fields = (
        "title",
        "due_date",
        "due_time",
        "priority",
        "is_completed",
        "recurrence",
    )

    class Priority(models.TextChoices):
        """Mức độ ưu tiên."""

        LOW = "LOW", "Thấp"
        MEDIUM = "MEDIUM", "Trung bình"
        HIGH = "HIGH", "Cao"
        URGENT = "URGENT", "Khẩn cấp"

    class Recurrence(models.TextChoices):
        """Chu kỳ lặp nhắc việc."""

        NONE = "NONE", "Không lặp"
        DAILY = "DAILY", "Hàng ngày"
        WEEKLY = "WEEKLY", "Hàng tuần"
        MONTHLY = "MONTHLY", "Hàng tháng"
        YEARLY = "YEARLY", "Hàng năm"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workspace_reminders",
        verbose_name="Chủ sở hữu",
        help_text="Người sở hữu nhắc việc.",
        db_comment="Chủ sở hữu nhắc việc",
    )
    title = models.CharField(
        max_length=255,
        verbose_name="Tiêu đề",
        help_text="Nội dung nhắc việc ngắn gọn.",
        db_comment="Tiêu đề nhắc việc",
    )
    description = models.TextField(
        blank=True,
        default="",
        verbose_name="Mô tả chi tiết",
        help_text="Ghi chú thêm cho công việc.",
        db_comment="Mô tả nhắc việc",
    )
    due_date = models.DateField(
        db_index=True,
        verbose_name="Ngày đến hạn",
        help_text="Ngày thực hiện công việc.",
        db_comment="Ngày đến hạn",
    )
    due_time = models.TimeField(
        null=True,
        blank=True,
        verbose_name="Giờ đến hạn",
        help_text="Giờ cụ thể trong ngày (để trống nếu nhắc cả ngày).",
        db_comment="Giờ đến hạn",
    )
    notify_minutes_before = models.PositiveSmallIntegerField(
        default=0,
        verbose_name="Nhắc trước (phút)",
        help_text="Số phút thông báo trước thời điểm đến hạn.",
        db_comment="Nhắc trước phút",
    )
    priority = models.CharField(
        max_length=16,
        choices=Priority.choices,
        default=Priority.MEDIUM,
        verbose_name="Độ ưu tiên",
        help_text="Mức độ quan trọng của việc.",
        db_comment="Độ ưu tiên",
    )
    is_completed = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Đã hoàn thành",
        help_text="Trạng thái hoàn thành công việc.",
        db_comment="Đã hoàn thành",
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Hoàn thành lúc",
        help_text="Thời điểm đánh dấu hoàn thành.",
        db_comment="Thời điểm hoàn thành",
    )
    recurrence = models.CharField(
        max_length=16,
        choices=Recurrence.choices,
        default=Recurrence.NONE,
        verbose_name="Lặp lại",
        help_text="Chu kỳ tự động tạo việc kế tiếp khi hoàn thành.",
        db_comment="Chu kỳ lặp lại",
    )
    anchor_day = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        verbose_name="Ngày chốt định kỳ",
        help_text="Ngày gốc (1–31) giữ mốc lặp khi cộng tháng.",
        db_comment="Ngày gốc lặp",
    )
    tags = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Thẻ gắn",
        help_text="Nhãn phân loại công việc.",
        db_comment="Nhãn nhắc việc",
    )

    class Meta:
        db_table = "workspace_reminder"
        indexes = (
            models.Index(
                fields=("owner", "is_completed", "due_date"),
                condition=Q(deleted_at__isnull=True),
                name="idx_ws_reminder_owner_due",
            ),
        )
        verbose_name = "Nhắc việc"
        verbose_name_plural = "Nhắc việc"

    def __str__(self) -> str:
        """Tiêu đề nhắc việc."""
        return self.title
