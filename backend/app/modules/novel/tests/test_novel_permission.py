"""Kiểm thử tính độc lập của danh mục quyền trong module Novel."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.novel.permissions.author_permission import AuthorPermission as AuthorP
from app.modules.novel.permissions.chapter_permission import ChapterPermission as ChapterP
from app.modules.novel.permissions.genre_permission import GenrePermission as GenreP
from app.modules.novel.permissions.novel_permission import NovelPermission as NovelP
from app.modules.novel.permissions.tag_permission import TagPermission as TagP

pytestmark = pytest.mark.django_db


class TestNovelPermission(BaseApiTestCase):
    """Đảm bảo mỗi API có quyền riêng, mỗi model 1 file permission."""

    def test_permission_catalog_count(self) -> None:
        """Khai báo đủ quyền độc lập cho từng model."""
        novel_perms = NovelP.all()
        chapter_perms = ChapterP.all()
        author_perms = AuthorP.all()
        genre_perms = GenreP.all()
        tag_perms = TagP.all()

        assert len(novel_perms) == 6
        assert len(chapter_perms) == 4
        assert len(author_perms) == 4
        assert len(genre_perms) == 4
        assert len(tag_perms) == 4

        all_codes = {
            *(p.code for p in novel_perms),
            *(p.code for p in chapter_perms),
            *(p.code for p in author_perms),
            *(p.code for p in genre_perms),
            *(p.code for p in tag_perms),
        }
        assert len(all_codes) == 22

    def test_novel_read_permission_is_isolated(self, user: Any, login: Any) -> None:
        """Có quyền novel.novel.read không được đọc chapter, author, genre, tag."""
        grant(user, NovelP.READ)
        api = login(user)

        # Được xem danh sách truyện
        res = api.get("/api/v1/novel/novels")
        assert res.status_code == 200

        # Bị cấm xem chương, tác giả, thể loại, thẻ
        self.assert_forbidden(api.get("/api/v1/novel/chapters"))
        self.assert_forbidden(api.get("/api/v1/novel/authors"))
        self.assert_forbidden(api.get("/api/v1/novel/genres"))
        self.assert_forbidden(api.get("/api/v1/novel/tags"))

    def test_author_read_permission_is_isolated(self, user: Any, login: Any) -> None:
        """Chỉ có quyền novel.author.read thì chỉ xem được tác giả."""
        grant(user, AuthorP.READ)
        api = login(user)

        assert api.get("/api/v1/novel/authors").status_code == 200
        self.assert_forbidden(api.get("/api/v1/novel/novels"))
        self.assert_forbidden(api.get("/api/v1/novel/chapters"))
        self.assert_forbidden(api.get("/api/v1/novel/genres"))
        self.assert_forbidden(api.get("/api/v1/novel/tags"))

    def test_genre_read_permission_is_isolated(self, user: Any, login: Any) -> None:
        """Chỉ có quyền novel.genre.read thì chỉ xem được thể loại."""
        grant(user, GenreP.READ)
        api = login(user)

        assert api.get("/api/v1/novel/genres").status_code == 200
        self.assert_forbidden(api.get("/api/v1/novel/novels"))
        self.assert_forbidden(api.get("/api/v1/novel/chapters"))
        self.assert_forbidden(api.get("/api/v1/novel/authors"))
        self.assert_forbidden(api.get("/api/v1/novel/tags"))

    def test_tag_read_permission_is_isolated(self, user: Any, login: Any) -> None:
        """Chỉ có quyền novel.tag.read thì chỉ xem được thẻ."""
        grant(user, TagP.READ)
        api = login(user)

        assert api.get("/api/v1/novel/tags").status_code == 200
        self.assert_forbidden(api.get("/api/v1/novel/novels"))
        self.assert_forbidden(api.get("/api/v1/novel/chapters"))
        self.assert_forbidden(api.get("/api/v1/novel/authors"))
        self.assert_forbidden(api.get("/api/v1/novel/genres"))

    def test_import_permission_required(self, user: Any, login: Any) -> None:
        """Import truyện yêu cầu quyền novel.novel.import."""
        grant(user, NovelP.READ, NovelP.CREATE)
        api = login(user)

        # Dù có quyền tạo truyện, nhưng không có quyền IMPORT thì bị 403
        payload = {
            "novel": {"title": "Truyện Test", "slug": "truyen-test-import-2"},
            "chapters": [],
        }
        self.assert_forbidden(api.post("/api/v1/novel/novels/import", payload, format="json"))

        # Cấp quyền import thì thành công
        grant(user, NovelP.IMPORT)
        res = api.post("/api/v1/novel/novels/import", payload, format="json")
        assert res.status_code == 201
