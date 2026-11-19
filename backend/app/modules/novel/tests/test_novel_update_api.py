"""Kiểm thử endpoint cập nhật tiểu thuyết: PATCH /api/v1/novel/novels/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.tests.factories.user_factory import UserFactory
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.novel.models.novel import Novel
from app.modules.novel.permissions.novel_permission import NovelPermission
from app.modules.novel.tests.factories.author_factory import AuthorFactory
from app.modules.novel.tests.factories.genre_factory import GenreFactory
from app.modules.novel.tests.factories.novel_factory import NovelFactory

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/novel/novels"


class TestNovelUpdateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint PATCH /api/v1/novel/novels/{id}."""

    def test_update_success_full_data(self, user: Any, login: Any) -> None:
        """Cập nhật toàn bộ các trường của tiểu thuyết thành công."""
        author = AuthorFactory()
        genre = GenreFactory()
        novel = NovelFactory(owner=user, status="ONGOING")

        grant(user, NovelPermission.UPDATE)
        api = login(user)

        payload = {
            "title": "Tiêu Đề Mới",
            "slug": "tieu-de-moi",
            "description": "Mô tả mới toanh...",
            "status": "COMPLETED",
            "author_id": str(author.pk),
            "genre_ids": [str(genre.pk)],
        }
        res = api.patch(f"{BASE_URL}/{novel.pk}", payload, format="json")
        data = self.assert_success(res, 200)

        assert data["title"] == "Tiêu Đề Mới"
        assert data["slug"] == "tieu-de-moi"
        assert data["description"] == "Mô tả mới toanh..."
        assert data["status"] == "COMPLETED"
        assert data["author"]["id"] == str(author.pk)
        assert len(data["genres"]) == 1

        novel.refresh_from_db()
        assert novel.title == "Tiêu Đề Mới"
        assert novel.status == "COMPLETED"

    def test_update_success_partial_min_data(self, user: Any, login: Any) -> None:
        """Cập nhật từng phần (chỉ sửa 1 trường) thành công."""
        novel = NovelFactory(owner=user, status="ONGOING")
        grant(user, NovelPermission.UPDATE)
        api = login(user)

        res = api.patch(f"{BASE_URL}/{novel.pk}", {"status": "PAUSED"}, format="json")
        data = self.assert_success(res, 200)
        assert data["status"] == "PAUSED"
        assert data["title"] == novel.title

    def test_update_validation_duplicate_slug(self, user: Any, login: Any) -> None:
        """Báo lỗi khi cập nhật sang slug đã tồn tại ở truyện khác."""
        NovelFactory(owner=user, slug="slug-da-co")
        novel = NovelFactory(owner=user, slug="slug-hien-tai")

        grant(user, NovelPermission.UPDATE)
        api = login(user)

        res = api.patch(f"{BASE_URL}/{novel.pk}", {"slug": "slug-da-co"}, format="json")
        self.assert_error(res, 400, "NOVEL_SLUG_EXISTS")

    def test_update_validation_invalid_status(self, user: Any, login: Any) -> None:
        """Báo lỗi khi cập nhật status không hợp lệ."""
        novel = NovelFactory(owner=user)
        grant(user, NovelPermission.UPDATE)
        api = login(user)

        res = api.patch(f"{BASE_URL}/{novel.pk}", {"status": "INVALID_STATUS"}, format="json")
        self.assert_error(res, 400, "VALIDATION_ERROR")

    def test_update_owner_isolation_other_user_404(self, user: Any, login: Any) -> None:
        """Người dùng khác cập nhật truyện không phải của mình nhận 404."""
        other_user = UserFactory()
        novel = NovelFactory(owner=other_user)

        grant(user, NovelPermission.UPDATE)
        api = login(user)

        res = api.patch(f"{BASE_URL}/{novel.pk}", {"title": "Hack"}, format="json")
        self.assert_error(res, 404, "NOT_FOUND")

    def test_update_manage_all_success(self, user: Any, login: Any) -> None:
        """Có quyền MANAGE_ALL cập nhật được truyện của người khác."""
        other_user = UserFactory()
        novel = NovelFactory(owner=other_user, title="Gốc")

        grant(user, NovelPermission.UPDATE, NovelPermission.MANAGE_ALL)
        api = login(user)

        res = api.patch(f"{BASE_URL}/{novel.pk}", {"title": "Sửa Bằng Quyền Quản Lý"}, format="json")
        data = self.assert_success(res, 200)
        assert data["title"] == "Sửa Bằng Quyền Quản Lý"

    def test_update_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        novel = NovelFactory()
        res = client.patch(f"{BASE_URL}/{novel.pk}", {"title": "Chưa Đăng Nhập"}, format="json")
        self.assert_unauthorized(res)

    def test_update_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền novel.novel.update bị 403."""
        novel = NovelFactory(owner=user)
        api = login(user)
        res = api.patch(f"{BASE_URL}/{novel.pk}", {"title": "Thiếu Quyền"}, format="json")
        self.assert_forbidden(res)

    def test_update_response_envelope(self, user: Any, login: Any) -> None:
        """Kiểm tra envelope response chuẩn."""
        novel = NovelFactory(owner=user)
        grant(user, NovelPermission.UPDATE)
        api = login(user)

        res = api.patch(f"{BASE_URL}/{novel.pk}", {"title": "Envelope Test"}, format="json")
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        assert "request_id" in body["meta"]
        assert body["data"]["title"] == "Envelope Test"
        self.assert_no_sensitive_data(res)
