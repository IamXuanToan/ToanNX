"""Model lịch sử đọc truyện."""

from django.db import models

from app.core.models.core_model import CoreModel


class ReadingHistory(CoreModel):
    """Lịch sử đọc chương truyện của người dùng."""

    user = models.ForeignKey(
        "account.User",
        on_delete=models.CASCADE,
        related_name="novel_reading_histories",
        verbose_name="Người đọc",
        db_comment="Người đọc chương này",
    )
    novel = models.ForeignKey(
        "novel.Novel",
        on_delete=models.CASCADE,
        related_name="reading_histories",
        verbose_name="Truyện",
        db_comment="Truyện đã đọc",
    )
    chapter = models.ForeignKey(
        "novel.Chapter",
        on_delete=models.CASCADE,
        related_name="+",
        verbose_name="Chương đã đọc",
        db_comment="Chương truyện đã đọc",
    )
    last_read_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Thời điểm đọc gần nhất",
        db_comment="Thời điểm gần nhất đọc chương này",
    )

    class Meta:
        db_table = "novel_reading_history"
        verbose_name = "Lịch sử đọc"
        verbose_name_plural = "Lịch sử đọc"
        ordering = ("-last_read_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["user", "chapter"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_user_chapter_read_alive",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.user} - {self.novel.title} - Ch.{self.chapter.chapter_number}"
