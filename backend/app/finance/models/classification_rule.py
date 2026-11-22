"""Quy tắc nhận diện: regex trên nội dung chuyển khoản đã chuẩn hóa → nền tảng."""

from django.conf import settings
from django.db import models

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class ClassificationRule(JournalTracker, CoreModel):
    """Ưu tiên lớn thắng; bằng nhau thì quy tắc tạo trước thắng."""

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="finance_rules",
        verbose_name="Chủ",
        help_text="Người dùng sở hữu.",
        db_comment="Chủ",
    )
    name = models.CharField(max_length=150, verbose_name="Tên", help_text="Tên quy tắc.", db_comment="Tên")
    platform = models.ForeignKey(
        "finance.Platform",
        on_delete=models.CASCADE,
        related_name="rules",
        verbose_name="Nền tảng",
        help_text="Nền tảng gán khi khớp.",
        db_comment="Nền tảng",
    )
    pattern = models.CharField(
        max_length=500,
        verbose_name="Regex",
        help_text="So trên nội dung đã bỏ dấu, viết hoa.",
        db_comment="Biểu thức regex",
    )
    priority = models.IntegerField(
        default=100, verbose_name="Ưu tiên", help_text="Lớn thắng.", db_comment="Ưu tiên"
    )
    is_active = models.BooleanField(
        default=True, verbose_name="Đang bật", help_text="Tắt để bỏ qua.", db_comment="Đang bật"
    )

    class Meta:
        db_table = "finance_classification_rule"
        verbose_name = "Quy tắc nhận diện"
        verbose_name_plural = "Quy tắc nhận diện"
        ordering = ("-priority", "created_at")

    def __str__(self) -> str:
        """Tên quy tắc."""
        return self.name
