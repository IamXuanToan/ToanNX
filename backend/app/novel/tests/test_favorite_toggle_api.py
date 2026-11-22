"""Kiểm thử endpoint bật/tắt yêu thích: POST /api/v1/novel/favorites/toggle."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.novel.models.favorite import Favorite
from app.novel.tests.factories.novel_factory import NovelFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/novel/favorites/toggle"


class TestFavoriteToggleApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/novel/favorites/toggle."""

    def test_toggle_add_and_remove(self, user: Any, login: Any) -> None:
        """Bật yêu thích thành công, gọi lại lần nữa sẽ hủy yêu thích."""
        novel = NovelFactory()
        api = login(user)

        # 1. Bật yêu thích (chưa có -> tạo mới)
        res1 = api.post(URL, {"novel_id": str(novel.pk)}, format="json")
        data1 = self.assert_success(res1, 200)
        assert data1["is_favorite"] is True
        assert Favorite.objects.filter(user=user, novel=novel).exists() is True

        # 2. Bấm toggle lại (đã có -> hủy)
        res2 = api.post(URL, {"novel_id": str(novel.pk)}, format="json")
        data2 = self.assert_success(res2, 200)
        assert data2["is_favorite"] is False
        assert Favorite.objects.filter(user=user, novel=novel).exists() is False

    def test_toggle_validation_missing_novel_id(self, user: Any, login: Any) -> None:
        """Validate lỗi khi thiếu novel_id."""
        api = login(user)
        res = api.post(URL, {}, format="json")
        error = self.assert_error(res, 400, "VALIDATION_ERROR")
        assert "novel_id" in error["details"]

    def test_toggle_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(URL, {}, format="json")
        self.assert_unauthorized(res)
