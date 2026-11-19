"""Integration tests cho API Truyện yêu thích (/api/v1/novel/favorites)."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.novel.models.favorite import Favorite
from app.modules.novel.models.novel import Novel
from app.modules.novel.permissions.novel_permission import NovelPermission

pytestmark = pytest.mark.django_db
BASE_NOVELS = "/api/v1/novel/novels"
BASE_FAVORITES = "/api/v1/novel/favorites"


class TestFavoriteApi(BaseApiTestCase):
    """Kiểm thử API quản lý danh sách truyện yêu thích của độc giả."""

    def test_favorite_toggle_and_list(self, user: Any, login: Any) -> None:
        """Kiểm tra bật/tắt yêu thích tiểu thuyết và danh sách truyện yêu thích."""
        grant(user, NovelPermission.CREATE)
        api = login(user)

        novel = self.assert_success(
            api.post(BASE_NOVELS, {"title": "Cổ Chân Nhân", "slug": "co-chan-nhan"}, format="json"),
            201,
        )
        novel_id = novel["id"]

        # 1. Bật yêu thích (is_favorite -> True)
        res_on = self.assert_success(
            api.post(f"{BASE_FAVORITES}/toggle", {"novel_id": novel_id}, format="json")
        )
        assert res_on["is_favorite"] is True
        assert res_on["favorites_count"] == 1
        assert Favorite.objects.alive().filter(user=user, novel_id=novel_id).exists() is True
        assert Novel.objects.get(pk=novel_id).favorites_count == 1

        # 2. Lấy danh sách yêu thích
        fav_list = self.assert_success(api.get(BASE_FAVORITES))
        assert len(fav_list) == 1
        assert fav_list[0]["novel_id"] == novel_id

        # 3. Tắt yêu thích (is_favorite -> False)
        res_off = self.assert_success(
            api.post(f"{BASE_FAVORITES}/toggle", {"novel_id": novel_id}, format="json")
        )
        assert res_off["is_favorite"] is False
        assert res_off["favorites_count"] == 0
        assert Favorite.objects.alive().filter(user=user, novel_id=novel_id).exists() is False

        # Danh sách sau khi gỡ
        empty_favs = self.assert_success(api.get(BASE_FAVORITES))
        assert len(empty_favs) == 0

    def test_favorite_unauthorized(self, client: Any) -> None:
        """Kiểm tra 401 khi chưa đăng nhập vào các endpoint yêu thích."""
        self.assert_unauthorized(client.get(BASE_FAVORITES))
        self.assert_unauthorized(client.post(f"{BASE_FAVORITES}/toggle", {}, format="json"))
