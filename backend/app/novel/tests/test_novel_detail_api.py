"""Kiểm thử endpoint chi tiết tiểu thuyết: GET /api/v1/novel/novels/{id}."""

import uuid
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.novel.permissions.novel_permission import NovelPermission
from app.novel.tests.factories.author_factory import AuthorFactory
from app.novel.tests.factories.genre_factory import GenreFactory
from app.novel.tests.factories.novel_factory import NovelFactory
from app.novel.tests.factories.tag_factory import TagFactory
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/novel/novels"


class TestNovelDetailApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/novel/novels/{id}."""

    def test_detail_success_full_data(self, user: Any, login: Any) -> None:
        """Lấy chi tiết tiểu thuyết thành công với đầy đủ quan hệ tác giả, thể loại, thẻ."""
        author = AuthorFactory()
        genre = GenreFactory()
        tag = TagFactory()
        novel = NovelFactory(owner=user, author=author, status="ONGOING")
        novel.genres.add(genre)
        novel.tags.add(tag)

        grant(user, NovelPermission.READ)
        api = login(user)

        res = api.get(f"{BASE_URL}/{novel.pk}")
        data = self.assert_success(res, 200)

        assert data["id"] == str(novel.pk)
        assert data["title"] == novel.title
        assert data["slug"] == novel.slug
        assert data["status"] == "ONGOING"
        assert data["author"]["id"] == str(author.pk)
        assert len(data["genres"]) == 1
        assert data["genres"][0]["id"] == str(genre.pk)
        assert len(data["tags"]) == 1
        assert data["tags"][0]["id"] == str(tag.pk)

    def test_detail_owner_isolation_other_user_404(self, user: Any, login: Any) -> None:
        """Người dùng khác xem truyện không phải của mình nhận 404 (bảo mật ẩn tồn tại)."""
        other_user = UserFactory()
        novel = NovelFactory(owner=other_user)

        grant(user, NovelPermission.READ)
        api = login(user)

        res = api.get(f"{BASE_URL}/{novel.pk}")
        self.assert_error(res, 404, "NOT_FOUND")

    def test_detail_manage_all_success(self, user: Any, login: Any) -> None:
        """Người dùng có quyền MANAGE_ALL xem được truyện của người khác."""
        other_user = UserFactory()
        novel = NovelFactory(owner=other_user)

        grant(user, NovelPermission.READ, NovelPermission.MANAGE_ALL)
        api = login(user)

        res = api.get(f"{BASE_URL}/{novel.pk}")
        data = self.assert_success(res, 200)
        assert data["id"] == str(novel.pk)

    def test_detail_not_found(self, user: Any, login: Any) -> None:
        """Truy vấn id không tồn tại trả về 404 NOT_FOUND."""
        grant(user, NovelPermission.READ)
        api = login(user)

        res = api.get(f"{BASE_URL}/{uuid.uuid4()}")
        self.assert_error(res, 404, "NOT_FOUND")

    def test_detail_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        novel = NovelFactory()
        res = client.get(f"{BASE_URL}/{novel.pk}")
        self.assert_unauthorized(res)

    def test_detail_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền novel.novel.read bị 403."""
        novel = NovelFactory(owner=user)
        api = login(user)
        res = api.get(f"{BASE_URL}/{novel.pk}")
        self.assert_forbidden(res)

    def test_detail_response_envelope(self, user: Any, login: Any) -> None:
        """Kiểm tra envelope response chuẩn."""
        novel = NovelFactory(owner=user)
        grant(user, NovelPermission.READ)
        api = login(user)

        res = api.get(f"{BASE_URL}/{novel.pk}")
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        assert "request_id" in body["meta"]
        assert body["data"]["id"] == str(novel.pk)
        self.assert_no_sensitive_data(res)
