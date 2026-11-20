"""Khởi tạo models của module Novel."""

from app.novel.models.author import Author
from app.novel.models.chapter import Chapter
from app.novel.models.favorite import Favorite
from app.novel.models.genre import Genre
from app.novel.models.novel import Novel, NovelStatus
from app.novel.models.reading_history import ReadingHistory
from app.novel.models.tag import Tag

__all__ = [
    "Author",
    "Chapter",
    "Favorite",
    "Genre",
    "Novel",
    "NovelStatus",
    "ReadingHistory",
    "Tag",
]
