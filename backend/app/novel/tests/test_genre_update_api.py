"""Kiểm thử endpoint cập nhật thể loại: PATCH /api/v1/novel/genres/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.tests.helpers.permission_helper import grant
from app.novel.permissions.genre_permission import GenrePermission
from app.novel.tests.factories.genre_factory import GenreFactory

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/novel/genres"


class TestGenreUpdateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint PATCH /api/v1/novel/genres/{id}."""

    def test_update_success_full_data(self, user: Any, login: Any) -> None:
        """Cập nhật thể loại thành công."""
        genre = GenreFactory(name="Cũ", slug="slug-cu-tl")
        grant(user, GenrePermission.UPDATE)
        api = login(user)

        payload = {"name": "Tên Mới", "slug": "slug-moi-tl", "description": "Mô tả mới"}
        res = api.patch(f"{BASE_URL}/{genre.pk}", payload, format="json")
        data = self.assert_success(res, 200)

        assert data["name"] == "Tên Mới"
        assert data["slug"] == "slug-moi-tl"
        assert data["description"] == "Mô tả mới"

    def test_update_validation_duplicate_slug(self, user: Any, login: Any) -> None:
        """Báo lỗi khi cập nhật trùng slug của thể loại khác."""
        GenreFactory(slug="slug-ton-tai-tl")
        genre = GenreFactory(slug="slug-cua-toi-tl")

        grant(user, GenrePermission.UPDATE)
        api = login(user)

        res = api.patch(f"{BASE_URL}/{genre.pk}", {"slug": "slug-ton-tai-tl"}, format="json")
        self.assert_error(res, 409, "CONFLICT")

    def test_update_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        genre = GenreFactory()
        res = client.patch(f"{BASE_URL}/{genre.pk}", {"name": "Test"}, format="json")
        self.assert_unauthorized(res)

    def test_update_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền novel.genre.update bị 403."""
        genre = GenreFactory()
        api = login(user)
        res = api.patch(f"{BASE_URL}/{genre.pk}", {"name": "Test"}, format="json")
        self.assert_forbidden(res)
