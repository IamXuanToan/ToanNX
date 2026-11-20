"""Kiểm thử endpoint danh sách tác giả: GET /api/v1/novel/authors."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.tests.helpers.permission_helper import grant
from app.novel.permissions.author_permission import AuthorPermission
from app.novel.tests.factories.author_factory import AuthorFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/novel/authors"


class TestAuthorListApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/novel/authors."""

    def test_list_success_paginated(self, user: Any, login: Any) -> None:
        """Lấy danh sách tác giả có phân trang."""
        AuthorFactory.create_batch(3)
        grant(user, AuthorPermission.READ)
        api = login(user)

        res = api.get(URL, {"page": 1, "page_size": 2})
        items, pagination = self.assert_paginated(res)

        assert len(items) == 2
        assert pagination["total"] == 3

    def test_list_search_by_name(self, user: Any, login: Any) -> None:
        """Tìm kiếm tác giả theo tên."""
        AuthorFactory(name="Kim Dung")
        AuthorFactory(name="Cổ Long")

        grant(user, AuthorPermission.READ)
        api = login(user)

        res = api.get(URL, {"search": "Kim Dung", "page": 1})
        items, _ = self.assert_paginated(res)
        assert len(items) == 1
        assert items[0]["name"] == "Kim Dung"

    def test_list_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(URL)
        self.assert_unauthorized(res)

    def test_list_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền novel.author.read bị 403."""
        api = login(user)
        res = api.get(URL)
        self.assert_forbidden(res)
