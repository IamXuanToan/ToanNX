"""Kiểm thử endpoint chi tiết thể loại: GET /api/v1/novel/genres/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.novel.permissions.genre_permission import GenrePermission
from app.modules.novel.tests.factories.genre_factory import GenreFactory

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/novel/genres"


class TestGenreDetailApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/novel/genres/{id}."""

    def test_detail_success_full_data(self, user: Any, login: Any) -> None:
        """Lấy chi tiết thể loại thành công."""
        genre = GenreFactory(name="Đô Thị", description="Hiện đại...")
        grant(user, GenrePermission.READ)
        api = login(user)

        res = api.get(f"{BASE_URL}/{genre.pk}")
        data = self.assert_success(res, 200)

        assert data["id"] == str(genre.pk)
        assert data["name"] == "Đô Thị"
        assert data["description"] == "Hiện đại..."

    def test_detail_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        genre = GenreFactory()
        res = client.get(f"{BASE_URL}/{genre.pk}")
        self.assert_unauthorized(res)

    def test_detail_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền novel.genre.read bị 403."""
        genre = GenreFactory()
        api = login(user)
        res = api.get(f"{BASE_URL}/{genre.pk}")
        self.assert_forbidden(res)
