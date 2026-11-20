"""Đăng ký module Novel."""

from app.core.registry.module_descriptor import ModuleDescriptor
from app.novel.permissions.author_permission import AuthorPermission
from app.novel.permissions.chapter_permission import ChapterPermission
from app.novel.permissions.genre_permission import GenrePermission
from app.novel.permissions.novel_permission import NovelPermission
from app.novel.permissions.tag_permission import TagPermission

MODULE = ModuleDescriptor(
    code="novel",
    name="Novel",
    description="Quản lý và đọc truyện tiểu thuyết.",
    version="1.0.0",
    dependencies=("account", "iam", "authentication", "attachment"),
    permissions=(
        *NovelPermission.all(),
        *ChapterPermission.all(),
        *AuthorPermission.all(),
        *GenrePermission.all(),
        *TagPermission.all(),
    ),
)
