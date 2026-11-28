"""Model Chủ đề nhắc việc (mặc định hệ thống dùng chung + chủ đề cá nhân theo owner)."""

from django.conf import settings
from django.db import models
from django.db.models import Q
from django.db.models.functions import Lower

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class ReminderTopic(JournalTracker, CoreModel):
    """Chủ đề phân loại nhắc việc (`owner=None` là mặc định hệ thống cho mọi người dùng)."""

    journal_fields = ("name", "color", "sort_order", "is_system")

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="reminder_topics",
        verbose_name="Chủ sở hữu",
        help_text="Trống = chủ đề mặc định của hệ thống; có giá trị = chủ đề riêng của người dùng.",
        db_comment="Chủ sở hữu chủ đề nhắc việc",
    )
    code = models.CharField(
        max_length=64,
        blank=True,
        default="",
        verbose_name="Mã chủ đề",
        help_text="Mã định danh ngắn (dùng cho seed mặc định).",
        db_comment="Mã chủ đề nhắc việc",
    )
    name = models.CharField(
        max_length=80,
        verbose_name="Tên chủ đề",
        help_text="Tên chủ đề nhắc việc (ví dụ: Công việc, Ngày kỷ niệm, Ngày giỗ).",
        db_comment="Tên chủ đề nhắc việc",
    )
    color = models.CharField(
        max_length=7,
        default="#3D812E",
        verbose_name="Màu nhãn",
        help_text="Mã màu #RRGGBB hiển thị cho chủ đề.",
        db_comment="Màu hiển thị chủ đề",
    )
    sort_order = models.PositiveSmallIntegerField(
        default=10,
        verbose_name="Thứ tự",
        help_text="Thứ tự sắp xếp (nhỏ hơn hiển thị trước).",
        db_comment="Thứ tự hiển thị",
    )
    is_system = models.BooleanField(
        default=False,
        verbose_name="Chủ đề mặc định",
        help_text="True nếu là chủ đề mặc định hệ thống.",
        db_comment="Cờ chủ đề mặc định",
    )

    class Meta:
        db_table = "workspace_reminder_topic"
        constraints = (
            models.UniqueConstraint(
                "owner",
                Lower("name"),
                condition=Q(deleted_at__isnull=True, owner__isnull=False),
                name="uniq_ws_rem_topic_owner_name_alive",
            ),
            models.UniqueConstraint(
                Lower("name"),
                condition=Q(deleted_at__isnull=True, owner__isnull=True),
                name="uniq_ws_rem_topic_system_name_alive",
            ),
        )
        indexes = (
            models.Index(
                fields=("owner", "sort_order"),
                condition=Q(deleted_at__isnull=True),
                name="idx_ws_rem_topic_owner_sort",
            ),
        )
        verbose_name = "Chủ đề nhắc việc"
        verbose_name_plural = "Chủ đề nhắc việc"

    def __str__(self) -> str:
        """Tên chủ đề."""
        return self.name
