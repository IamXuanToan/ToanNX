"""Kiểm thử endpoint danh sách thể loại: GET /api/v1/novel/genres."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.novel.permissions.genre_permission import GenrePermission
from app.modules.novel.tests.factories.genre_factory import GenreFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/novel/genres"


class TestGenreListApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/novel/genres."""

    def test_list_success_paginated(self, user: Any, login: Any) -> None:
        """Lấy danh sách thể loại có phân trang."""
        GenreFactory.create_batch(3)
        grant(user, GenrePermission.READ)
        api = login(user)

        res = api.get(URL, {"page": 1, "page_size": 2})
        items, pagination = self.assert_paginated(res)

        assert len(items) == 2
        assert pagination["total"] == 3

    def test_list_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(URL)
        self.assert_unauthorized(res)

    def test_list_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền novel.genre.read bị 403."""
        api = login(user)
        res = api.get(URL)
        self.assert_forbidden(res)
