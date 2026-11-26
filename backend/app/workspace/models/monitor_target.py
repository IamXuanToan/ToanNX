"""Model Mục tiêu giám sát Uptime/HTTP."""

from django.conf import settings
from django.db import models
from django.db.models import Q

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class MonitorTarget(JournalTracker, CoreModel):
    """Đích URL được cron kiểm tra định kỳ qua SafeHttpClient (timeout tối đa 5s)."""

    journal_fields = (
        "name",
        "url",
        "method",
        "expected_status",
        "timeout_seconds",
        "check_interval_minutes",
        "is_active",
    )

    class Method(models.TextChoices):
        """Phương thức HTTP kiểm tra."""

        GET = "GET", "GET"
        HEAD = "HEAD", "HEAD"

    class Status(models.TextChoices):
        """Trạng thái hoạt động của endpoint."""

        HEALTHY = "HEALTHY", "Ổn định"
        DEGRADED = "DEGRADED", "Chậm / Cảnh báo"
        DOWN = "DOWN", "Ngừng phản hồi"
        UNKNOWN = "UNKNOWN", "Chưa kiểm tra"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workspace_monitor_targets",
        verbose_name="Chủ sở hữu",
        help_text="Người sở hữu mục tiêu giám sát.",
        db_comment="Chủ sở hữu monitor",
    )
    name = models.CharField(
        max_length=150,
        verbose_name="Tên dịch vụ giám sát",
        help_text="Tên gợi nhớ website/API.",
        db_comment="Tên monitor",
    )
    url = models.URLField(
        max_length=500,
        verbose_name="URL kiểm tra",
        help_text="Đường dẫn công khai (bị chặn nếu trỏ mạng nội bộ/SSRF).",
        db_comment="URL giám sát",
    )
    method = models.CharField(
        max_length=8,
        choices=Method.choices,
        default=Method.GET,
        verbose_name="Phương thức",
        help_text="Phương thức HTTP dùng khi ping.",
        db_comment="HTTP method",
    )
    expected_status = models.PositiveIntegerField(
        default=200,
        verbose_name="Mã HTTP kỳ vọng",
        help_text="Mã trạng thái HTTP coi là thành công (200..399 hoặc mã cụ thể).",
        db_comment="Mã HTTP kỳ vọng",
    )
    timeout_seconds = models.PositiveSmallIntegerField(
        default=4,
        verbose_name="Timeout (giây)",
        help_text="Giới hạn tối đa 5 giây cho mỗi lượt ping.",
        db_comment="Timeout tối đa 5s",
    )
    check_interval_minutes = models.PositiveIntegerField(
        default=30,
        verbose_name="Chu kỳ kiểm tra (phút)",
        help_text="Khoảng cách tối thiểu giữa các lần ping (tối thiểu 15 phút).",
        db_comment="Chu kỳ ping phút",
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Đang bật",
        help_text="Tắt để tạm ngưng ping định kỳ.",
        db_comment="Đang bật giám sát",
    )
    last_status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.UNKNOWN,
        verbose_name="Trạng thái gần nhất",
        help_text="Kết quả ping mới nhất.",
        db_comment="Trạng thái gần nhất",
    )
    last_status_code = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="Mã HTTP gần nhất",
        help_text="HTTP status code trả về ở lần ping gần nhất.",
        db_comment="Mã HTTP gần nhất",
    )
    last_latency_ms = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="Độ trễ (ms)",
        help_text="Thời gian phản hồi tính bằng mili-giây.",
        db_comment="Độ trễ ms",
    )
    last_checked_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Kiểm tra lúc",
        help_text="Thời điểm thực hiện lượt ping mới nhất.",
        db_comment="Thời điểm ping mới nhất",
    )
    consecutive_failures = models.PositiveIntegerField(
        default=0,
        verbose_name="Số lỗi liên tiếp",
        help_text="Số lượt ping thất bại liên tục.",
        db_comment="Số lần lỗi liên tiếp",
    )

    class Meta:
        db_table = "workspace_monitor_target"
        indexes = (
            models.Index(
                fields=("owner", "is_active"),
                condition=Q(deleted_at__isnull=True),
                name="idx_ws_monitor_owner_active",
            ),
        )
        verbose_name = "Giám sát Uptime"
        verbose_name_plural = "Giám sát Uptime"

    def __str__(self) -> str:
        """Tên mục tiêu giám sát."""
        return self.name
