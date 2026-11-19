"""Model chương truyện."""

from django.db import models

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class Chapter(JournalTracker, CoreModel):
    """Chương của bộ truyện."""

    novel = models.ForeignKey(
        "novel.Novel",
        on_delete=models.CASCADE,
        related_name="chapters",
        verbose_name="Truyện",
        db_comment="Truyện chứa chương này",
    )
    chapter_number = models.PositiveIntegerField(
        verbose_name="Số thứ tự chương",
        help_text="Số thứ tự của chương trong truyện (1, 2, 3...).",
        db_comment="Số thứ tự chương",
    )
    title = models.CharField(
        max_length=255,
        verbose_name="Tiêu đề chương",
        help_text="Tiêu đề chương (ví dụ: Tiết 1: Thiếu niên xuất sơn).",
        db_comment="Tiêu đề chương",
    )
    slug = models.SlugField(
        max_length=255,
        verbose_name="Đường dẫn tĩnh",
        help_text="Slug định danh chương.",
        db_comment="Slug định danh chương",
    )
    content = models.TextField(
        verbose_name="Nội dung chương",
        help_text="Nội dung văn bản của chương truyện.",
        db_comment="Nội dung chương",
    )
    thumbnail = models.ForeignKey(
        "attachment.Attachment",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        verbose_name="Ảnh minh họa chương",
        help_text="Ảnh bìa hoặc ảnh minh họa của chương.",
        db_comment="Ảnh minh họa chương",
    )
    word_count = models.PositiveIntegerField(
        default=0,
        verbose_name="Số từ",
        db_comment="Số lượng từ trong chương",
    )
    views_count = models.PositiveIntegerField(
        default=0,
        verbose_name="Lượt xem chương",
        db_comment="Số lượt xem của chương",
    )
    is_published = models.BooleanField(
        default=True,
        verbose_name="Đã xuất bản",
        help_text="Cho phép người dùng đọc chương này.",
        db_comment="Trạng thái xuất bản chương",
    )

    class Meta:
        db_table = "novel_chapter"
        verbose_name = "Chương"
        verbose_name_plural = "Chương"
        ordering = ("chapter_number", "created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["novel", "chapter_number"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_novel_chapter_number_alive",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.novel.title} - Chương {self.chapter_number}: {self.title}"
