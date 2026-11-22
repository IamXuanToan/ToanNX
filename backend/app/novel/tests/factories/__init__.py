"""Factories cho module Novel."""

from app.novel.tests.factories.author_factory import AuthorFactory
from app.novel.tests.factories.chapter_factory import ChapterFactory
from app.novel.tests.factories.genre_factory import GenreFactory
from app.novel.tests.factories.novel_factory import NovelFactory
from app.novel.tests.factories.tag_factory import TagFactory

__all__ = [
    "AuthorFactory",
    "ChapterFactory",
    "GenreFactory",
    "NovelFactory",
    "TagFactory",
]
