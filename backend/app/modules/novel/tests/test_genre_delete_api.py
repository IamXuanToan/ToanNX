"""Kiểm thử endpoint xóa thể loại: DELETE /api/v1/novel/genres/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.novel.models.genre import Genre
from app.modules.novel.permissions.genre_permission import GenrePermission
from app.modules.novel.tests.factories.genre_factory import GenreFactory

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/novel/genres"


class TestGenreDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint DELETE /api/v1/novel/genres/{id}."""

    def test_delete_success_soft_delete(self, user: Any, login: Any) -> None:
        """Xóa mềm thể loại thành công (204 No Content)."""
        genre = GenreFactory()
        grant(user, GenrePermission.DELETE)
        api = login(user)

        res = api.delete(f"{BASE_URL}/{genre.pk}")
        assert res.status_code == 204

        genre.refresh_from_db()
        assert genre.deleted_at is not None
        assert Genre.objects.alive().filter(pk=genre.pk).exists() is False

    def test_delete_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        genre = GenreFactory()
        res = client.delete(f"{BASE_URL}/{genre.pk}")
        self.assert_unauthorized(res)

    def test_delete_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền novel.genre.delete bị 403."""
        genre = GenreFactory()
        api = login(user)
        res = api.delete(f"{BASE_URL}/{genre.pk}")
        self.assert_forbidden(res)
