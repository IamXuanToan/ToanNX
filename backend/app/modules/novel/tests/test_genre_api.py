"""Integration tests cho API Thể loại (/api/v1/novel/genres)."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.novel.models.genre import Genre
from app.modules.novel.permissions.genre_permission import GenrePermission

pytestmark = pytest.mark.django_db
BASE_GENRES = "/api/v1/novel/genres"


class TestGenreApi(BaseApiTestCase):
    """Kiểm thử API quản trị thể loại tiểu thuyết."""

    def test_genre_crud_and_auto_slug(self, user: Any, login: Any) -> None:
        """Kiểm tra CRUD thể loại với slug tự động sinh từ tên và xóa mềm."""
        grant(
            user,
            GenrePermission.CREATE,
            GenrePermission.READ,
            GenrePermission.UPDATE,
            GenrePermission.DELETE,
        )
        api = login(user)

        # 1. Tạo thể loại không truyền slug
        created = self.assert_success(
            api.post(BASE_GENRES, {"name": "Tiên Hiệp", "description": "Tu tiên đắc đạo"}, format="json"),
            201,
        )
        genre_id = created["id"]
        assert created["name"] == "Tiên Hiệp"
        assert created["slug"] == "tien-hiep"

        # 2. Danh sách thể loại
        listed, pag = self.assert_paginated(api.get(BASE_GENRES, {"search": "Tiên", "page": 1}))
        assert pag["total"] == 1
        assert listed[0]["id"] == genre_id

        # 3. Chi tiết thể loại
        detail = self.assert_success(api.get(f"{BASE_GENRES}/{genre_id}"))
        assert detail["id"] == genre_id

        # 4. Cập nhật mô tả
        updated = self.assert_success(
            api.patch(f"{BASE_GENRES}/{genre_id}", {"description": "Mô tả mới"}, format="json")
        )
        assert updated["description"] == "Mô tả mới"

        # 5. Xóa mềm thể loại
        del_res = api.delete(f"{BASE_GENRES}/{genre_id}")
        assert del_res.status_code == 204
        self.assert_error(api.get(f"{BASE_GENRES}/{genre_id}"), 404, "NOT_FOUND")
        assert Genre.objects.alive().filter(pk=genre_id).exists() is False

    def test_genre_permissions(self, client: Any, user: Any, login: Any) -> None:
        """Kiểm tra 401 khi chưa đăng nhập và 403 khi thiếu quyền GenrePermission."""
        self.assert_unauthorized(client.get(BASE_GENRES))
        self.assert_unauthorized(client.post(BASE_GENRES, {"name": "Test"}, format="json"))

        api = login(user)
        self.assert_forbidden(api.get(BASE_GENRES))
        self.assert_forbidden(api.post(BASE_GENRES, {"name": "Test"}, format="json"))
