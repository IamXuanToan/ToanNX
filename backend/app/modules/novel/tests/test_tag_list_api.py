"""Kiểm thử endpoint danh sách thẻ: GET /api/v1/novel/tags."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.novel.permissions.tag_permission import TagPermission
from app.modules.novel.tests.factories.tag_factory import TagFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/novel/tags"


class TestTagListApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/novel/tags."""

    def test_list_success_paginated(self, user: Any, login: Any) -> None:
        """Lấy danh sách thẻ có phân trang."""
        TagFactory.create_batch(3)
        grant(user, TagPermission.READ)
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
        """Đã đăng nhập nhưng thiếu quyền novel.tag.read bị 403."""
        api = login(user)
        res = api.get(URL)
        self.assert_forbidden(res)
