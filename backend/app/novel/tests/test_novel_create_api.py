"""Kiểm thử endpoint tạo tiểu thuyết: POST /api/v1/novel/novels."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.tests.helpers.permission_helper import grant
from app.novel.models.novel import Novel
from app.novel.permissions.novel_permission import NovelPermission
from app.novel.tests.factories.author_factory import AuthorFactory
from app.novel.tests.factories.genre_factory import GenreFactory
from app.novel.tests.factories.tag_factory import TagFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/novel/novels"


class TestNovelCreateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/novel/novels."""

    def test_create_success_full_data(self, user: Any, login: Any) -> None:
        """Tạo tiểu thuyết thành công với đầy đủ các trường (required + optional)."""
        author = AuthorFactory()
        genre = GenreFactory()
        tag = TagFactory()
        grant(user, NovelPermission.CREATE)
        api = login(user)

        payload = {
            "title": "Phàm Nhân Tu Tiên",
            "slug": "pham-nhan-tu-tien",
            "description": "Hàn Lập một lòng cầu đạo trường sinh...",
            "status": "ONGOING",
            "author_id": str(author.pk),
            "genre_ids": [str(genre.pk)],
            "tag_ids": [str(tag.pk)],
        }
        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 201)

        assert data["title"] == "Phàm Nhân Tu Tiên"
        assert data["slug"] == "pham-nhan-tu-tien"
        assert data["status"] == "ONGOING"
        assert data["description"] == "Hàn Lập một lòng cầu đạo trường sinh..."
        assert data["author"]["id"] == str(author.pk)
        assert len(data["genres"]) == 1
        assert data["genres"][0]["id"] == str(genre.pk)
        assert len(data["tags"]) == 1
        assert data["tags"][0]["id"] == str(tag.pk)

        # Kiểm tra DB lưu đúng owner
        novel = Novel.objects.get(pk=data["id"])
        assert novel.owner_id == user.pk

    def test_create_success_min_data(self, user: Any, login: Any) -> None:
        """Tạo tiểu thuyết thành công với dữ liệu tối thiểu (chỉ các trường bắt buộc)."""
        grant(user, NovelPermission.CREATE)
        api = login(user)

        payload = {
            "title": "Truyện Tối Thiểu",
            "slug": "truyen-toi-thieu",
        }
        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 201)

        assert data["title"] == "Truyện Tối Thiểu"
        assert data["slug"] == "truyen-toi-thieu"
        assert data["status"] == "ONGOING"  # default
        assert data["description"] == ""
        assert data["author"] is None
        assert data["genres"] == []
        assert data["tags"] == []

    def test_create_validation_missing_required_fields(self, user: Any, login: Any) -> None:
        """Validate lỗi khi thiếu các trường bắt buộc."""
        grant(user, NovelPermission.CREATE)
        api = login(user)

        # Thiếu cả title và slug
        res = api.post(URL, {}, format="json")
        error = self.assert_error(res, 400, "VALIDATION_ERROR")
        assert "title" in error["details"]

    def test_create_validation_duplicate_slug(self, user: Any, login: Any) -> None:
        """Validate lỗi khi trùng slug tiểu thuyết."""
        grant(user, NovelPermission.CREATE)
        api = login(user)

        api.post(URL, {"title": "Truyện 1", "slug": "trung-slug"}, format="json")
        res = api.post(URL, {"title": "Truyện 2", "slug": "trung-slug"}, format="json")
        self.assert_error(res, 400, "NOVEL_SLUG_EXISTS")

    def test_create_validation_invalid_status(self, user: Any, login: Any) -> None:
        """Validate lỗi khi truyền trạng thái không hợp lệ."""
        grant(user, NovelPermission.CREATE)
        api = login(user)

        res = api.post(
            URL,
            {"title": "Truyện Sai Status", "slug": "sai-status", "status": "UNKNOWN"},
            format="json",
        )
        self.assert_error(res, 400, "VALIDATION_ERROR")

    def test_create_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập gọi API bị từ chối 401."""
        res = client.post(URL, {"title": "Khách", "slug": "khach"}, format="json")
        self.assert_unauthorized(res)

    def test_create_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Người dùng đăng nhập nhưng không có quyền novel.novel.create bị từ chối 403."""
        api = login(user)
        res = api.post(URL, {"title": "Thiếu Quyền", "slug": "thieu-quyen"}, format="json")
        self.assert_forbidden(res)

    def test_create_response_envelope(self, user: Any, login: Any) -> None:
        """Kiểm tra envelope response chuẩn {success, data, meta: {request_id}}."""
        grant(user, NovelPermission.CREATE)
        api = login(user)

        res = api.post(URL, {"title": "Envelope", "slug": "envelope-test"}, format="json")
        assert res.status_code == 201
        body = res.json()
        assert body["success"] is True
        assert "request_id" in body["meta"]
        assert "id" in body["data"]
        self.assert_no_sensitive_data(res)
