"""Kiểm thử endpoint danh sách truyện yêu thích: GET /api/v1/novel/favorites."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.tests.factories.user_factory import UserFactory
from app.modules.novel.models.favorite import Favorite
from app.modules.novel.tests.factories.novel_factory import NovelFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/novel/favorites"


class TestFavoriteListApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/novel/favorites."""

    def test_list_success(self, user: Any, login: Any) -> None:
        """Lấy danh sách tiểu thuyết yêu thích của chính mình thành công."""
        novel = NovelFactory()
        Favorite.objects.create(user=user, novel=novel)

        api = login(user)
        res = api.get(URL)
        data = self.assert_success(res, 200)

        assert len(data) == 1
        assert data[0]["novel_id"] == str(novel.pk)

    def test_list_owner_isolation(self, user: Any, login: Any) -> None:
        """Người dùng chỉ thấy danh sách yêu thích của mình, không thấy của người khác."""
        other_user = UserFactory()
        novel = NovelFactory()
        Favorite.objects.create(user=other_user, novel=novel)

        api = login(user)
        res = api.get(URL)
        data = self.assert_success(res, 200)
        assert len(data) == 0

    def test_list_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(URL)
        self.assert_unauthorized(res)
