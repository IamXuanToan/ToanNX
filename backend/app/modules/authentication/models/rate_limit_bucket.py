"""Model bộ đếm rate limit."""

from django.db import models


class RateLimitBucket(models.Model):
    """Bộ đếm rate limit theo cửa sổ cố định, lưu PostgreSQL (khóa đã băm SHA-256)."""

    key_hash = models.CharField(
        max_length=64,
        verbose_name="Khóa đã băm",
        help_text="SHA-256 của khóa rate limit (không lưu email/IP thô).",
        db_comment="SHA-256 của khóa",
    )
    window_start = models.DateTimeField(
        verbose_name="Bắt đầu cửa sổ",
        help_text="Thời điểm bắt đầu cửa sổ đếm cố định.",
        db_comment="Bắt đầu cửa sổ",
    )
    count = models.PositiveIntegerField(
        default=0,
        verbose_name="Số lần",
        help_text="Số lần gọi trong cửa sổ.",
        db_comment="Số lần gọi",
    )
    expires_at = models.DateTimeField(
        db_index=True,
        verbose_name="Hết hạn",
        help_text="Sau thời điểm này bản ghi có thể bị dọn.",
        db_comment="Hết hạn bản ghi",
    )

    class Meta:
        db_table = "auth_rate_limit_bucket"
        verbose_name = "Bộ đếm rate limit"
        verbose_name_plural = "Bộ đếm rate limit"
        constraints = [
            models.UniqueConstraint(fields=["key_hash", "window_start"], name="uniq_rate_limit_window")
        ]

    def __str__(self) -> str:
        """Biểu diễn ngắn gọn."""
        return f"{self.key_hash[:8]}={self.count}"
