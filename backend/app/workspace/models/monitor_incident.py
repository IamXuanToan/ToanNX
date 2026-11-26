"""Model Sự cố ngừng phản hồi của MonitorTarget (không dùng JournalTracker để tránh phình nhật ký)."""

from django.conf import settings
from django.db import models
from django.db.models import Q

from app.core.models.core_model import CoreModel


class MonitorIncident(CoreModel):
    """Lưu từng sự cố từ lúc DOWN đến lúc phục hồi HEALTHY."""

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workspace_monitor_incidents",
        verbose_name="Chủ sở hữu",
        help_text="Chủ sở hữu sự cố.",
        db_comment="Chủ sở hữu sự cố",
    )
    target = models.ForeignKey(
        "workspace.MonitorTarget",
        on_delete=models.CASCADE,
        related_name="incidents",
        verbose_name="Mục tiêu giám sát",
        help_text="Endpoint phát sinh sự cố.",
        db_comment="Mục tiêu giám sát",
    )
    started_at = models.DateTimeField(
        db_index=True,
        verbose_name="Bắt đầu lúc",
        help_text="Thời điểm phát hiện sự cố.",
        db_comment="Thời điểm bắt đầu sự cố",
    )
    resolved_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Phục hồi lúc",
        help_text="Thời điểm dịch vụ hoạt động bình thường trở lại.",
        db_comment="Thời điểm phục hồi",
    )
    status_code = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="Mã HTTP lỗi",
        help_text="Mã phản hồi HTTP gây lỗi (nếu có).",
        db_comment="Mã HTTP sự cố",
    )
    error_message = models.TextField(
        blank=True,
        default="",
        verbose_name="Chi tiết lỗi",
        help_text="Mô tả nguyên nhân sự cố.",
        db_comment="Chi tiết lỗi",
    )
    duration_seconds = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="Thời lượng gián đoạn (giây)",
        help_text="Khoảng thời gian dịch vụ bị gián đoạn.",
        db_comment="Thời lượng sự cố giây",
    )

    class Meta:
        db_table = "workspace_monitor_incident"
        indexes = (
            models.Index(
                fields=("owner", "started_at"),
                condition=Q(deleted_at__isnull=True),
                name="idx_ws_incident_owner_start",
            ),
        )
        verbose_name = "Sự cố giám sát"
        verbose_name_plural = "Sự cố giám sát"

    def __str__(self) -> str:
        """Mô tả sự cố."""
        return f"{self.target.name} @ {self.started_at}"
