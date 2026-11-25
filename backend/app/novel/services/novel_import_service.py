"""Service import tiểu thuyết và các chương từ template JSON."""

from typing import Any

from django.db import transaction

from app.core.exceptions.app_exception import AppException
from app.core.utils.text import ascii_slug as to_slug
from app.novel.constants.novel_error_code import NovelErrorCode
from app.novel.models.chapter import Chapter
from app.novel.models.novel import NovelStatus
from app.novel.repositories.author_repository import AuthorRepository
from app.novel.repositories.chapter_repository import ChapterRepository
from app.novel.repositories.genre_repository import GenreRepository
from app.novel.repositories.novel_repository import NovelRepository
from app.novel.repositories.tag_repository import TagRepository


class NovelImportService:
    """Service nghiệp vụ tạo file mẫu và nhập khẩu tiểu thuyết hàng loạt."""

    def __init__(
        self,
        novel_repository: NovelRepository | None = None,
        chapter_repository: ChapterRepository | None = None,
        author_repository: AuthorRepository | None = None,
        genre_repository: GenreRepository | None = None,
        tag_repository: TagRepository | None = None,
    ) -> None:
        """Khởi tạo NovelImportService với các repository liên quan.

        Args:
            novel_repository: NovelRepository tra cứu và tạo truyện.
            chapter_repository: ChapterRepository tạo các chương truyện.
            author_repository: AuthorRepository tạo hoặc lấy tác giả.
            genre_repository: GenreRepository tạo hoặc lấy thể loại.
            tag_repository: TagRepository tạo hoặc lấy thẻ.
        """
        self.novel_repository = novel_repository or NovelRepository()
        self.chapter_repository = chapter_repository or ChapterRepository()
        self.author_repository = author_repository or AuthorRepository()
        self.genre_repository = genre_repository or GenreRepository()
        self.tag_repository = tag_repository or TagRepository()

    def get_template(self) -> dict[str, Any]:
        """Trả về cấu trúc template mẫu JSON để người dùng tải về tham khảo.

        Returns:
            dict[str, Any]: Từ điển mẫu chứa thông tin truyện và các chương mẫu.
        """
        return {
            "format_version": "1.0",
            "novel": {
                "title": "Phàm Nhân Tu Tiên",
                "slug": "pham-nhan-tu-tien",
                "original_title": "凡人修仙传",
                "author": "Vong Ngữ",
                "description": (
                    "Một thiếu niên bình thường xuất thân nghèo khó bước vào con đường tu tiên trắc trở..."
                ),
                "status": NovelStatus.COMPLETED.value,
                "genres": ["Tiên Hiệp", "Huyền Huyễn", "Tu Chân"],
                "tags": ["Phàm nhân", "Tu đạo", "Dài tập"],
                "is_published": True,
            },
            "chapters": [
                {
                    "chapter_number": 1,
                    "title": "Sơn thôn thiếu niên",
                    "content": (
                        "Tại một thôn trang hẻo lánh, thiếu niên da ngăm đen đang ngồi trên tảng đá lớn..."
                    ),
                },
                {
                    "chapter_number": 2,
                    "title": "Thất Huyền môn",
                    "content": (
                        "Sáng sớm hôm sau, chiếc xe ngựa đưa đám thiếu niên về phía Thất Huyền môn..."
                    ),
                },
            ],
        }

    @transaction.atomic
    def import_from_dict(self, actor: Any, data: dict[str, Any]) -> dict[str, Any]:
        """Import toàn bộ tiểu thuyết và các chương trong một transaction cơ sở dữ liệu.

        Args:
            actor: Người dùng thực hiện import (User).
            data: Dữ liệu JSON đã được validate.

        Returns:
            dict[str, Any]: Kết quả import gồm ID, tiêu đề, slug và số lượng chương đã tạo.

        Raises:
            AppException: Nếu thiếu tiêu đề truyện hoặc slug đã tồn tại trong hệ thống.
        """
        novel_data = data.get("novel")
        if not isinstance(novel_data, dict) or not novel_data.get("title"):
            raise AppException(
                "Dữ liệu import không hợp lệ: thiếu thông tin novel.title.",
                code=NovelErrorCode.NOVEL_IMPORT_INVALID,
            )

        title = str(novel_data["title"]).strip()
        slug = str(novel_data.get("slug") or to_slug(title)).strip()

        # Kiểm tra trùng lặp số chương trong danh sách import
        chapters_data = data.get("chapters") or []
        seen_numbers: set[int] = set()
        for index, ch in enumerate(chapters_data, start=1):
            if not isinstance(ch, dict):
                continue
            ch_num = int(ch.get("chapter_number") or index)
            if ch_num in seen_numbers:
                raise AppException(
                    f"Chương số {ch_num} bị trùng lặp trong dữ liệu import.",
                    code=NovelErrorCode.CHAPTER_NUMBER_EXISTS,
                )
            seen_numbers.add(ch_num)

        existing = self.novel_repository.find_by_slug(slug)
        if existing is not None:
            raise AppException(
                f"Truyện với slug '{slug}' đã tồn tại trong hệ thống.",
                code=NovelErrorCode.NOVEL_SLUG_EXISTS,
            )

        # Xử lý tác giả
        author_name = novel_data.get("author")
        author = None
        if author_name and str(author_name).strip():
            author = self.author_repository.get_or_create_by_name(str(author_name), actor)

        # Xử lý thể loại
        genres_list = novel_data.get("genres") or []
        genre_instances = [
            self.genre_repository.get_or_create_by_name(str(g), actor) for g in genres_list if str(g).strip()
        ]

        # Xử lý thẻ
        tags_list = novel_data.get("tags") or []
        tag_instances = [
            self.tag_repository.get_or_create_by_name(str(t), actor) for t in tags_list if str(t).strip()
        ]

        # Tạo Novel
        novel_fields = {
            "title": title,
            "slug": slug,
            "original_title": str(novel_data.get("original_title") or "").strip(),
            "description": str(novel_data.get("description") or "").strip(),
            "status": str(novel_data.get("status") or NovelStatus.ONGOING.value).upper(),
            "is_published": bool(novel_data.get("is_published", True)),
            "author": author,
            "owner": actor,
        }
        novel = self.novel_repository.create(actor=actor, **novel_fields)
        if genre_instances:
            novel.genres.set(genre_instances)
        if tag_instances:
            novel.tags.set(tag_instances)

        # Tạo các Chapters
        chapters_data = data.get("chapters") or []
        created_chapters = []
        for index, ch in enumerate(chapters_data, start=1):
            if not isinstance(ch, dict):
                continue
            ch_num = int(ch.get("chapter_number") or index)
            ch_title = str(ch.get("title") or f"Chương {ch_num}").strip()
            ch_content = str(ch.get("content") or "").strip()
            ch_slug = str(ch.get("slug") or f"chuong-{ch_num}").strip()
            word_count = int(ch.get("word_count") or len(ch_content.split()))

            chapter = Chapter(
                novel=novel,
                chapter_number=ch_num,
                title=ch_title,
                slug=ch_slug,
                content=ch_content,
                word_count=word_count,
                is_published=bool(ch.get("is_published", True)),
                created_by=actor,
                updated_by=actor,
            )
            created_chapters.append(chapter)

        if created_chapters:
            self.chapter_repository.bulk_create(created_chapters, actor=actor)

        return {
            "novel_id": str(novel.pk),
            "novel_title": novel.title,
            "novel_slug": novel.slug,
            "chapters_count": len(created_chapters),
        }
