"""Model truyện yêu thích."""

from django.db import models

from app.core.models.core_model import CoreModel


class Favorite(CoreModel):
    """Đánh dấu truyện yêu thích của người dùng."""

    user = models.ForeignKey(
        "system.User",
        on_delete=models.CASCADE,
        related_name="novel_favorites",
        verbose_name="Người dùng",
        db_comment="Người dùng thích truyện",
    )
    novel = models.ForeignKey(
        "novel.Novel",
        on_delete=models.CASCADE,
        related_name="favorites",
        verbose_name="Truyện yêu thích",
        db_comment="Truyện được yêu thích",
    )

    class Meta:
        db_table = "novel_favorite"
        verbose_name = "Truyện yêu thích"
        verbose_name_plural = "Truyện yêu thích"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["user", "novel"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_user_novel_favorite_alive",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.user} thích {self.novel.title}"
