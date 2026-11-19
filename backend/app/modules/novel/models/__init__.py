"""Khởi tạo models của module Novel."""

from app.modules.novel.models.author import Author
from app.modules.novel.models.chapter import Chapter
from app.modules.novel.models.favorite import Favorite
from app.modules.novel.models.genre import Genre
from app.modules.novel.models.novel import Novel, NovelStatus
from app.modules.novel.models.reading_history import ReadingHistory
from app.modules.novel.models.tag import Tag

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
