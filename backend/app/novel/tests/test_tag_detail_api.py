"""Kiểm thử endpoint chi tiết thẻ: GET /api/v1/novel/tags/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.tests.helpers.permission_helper import grant
from app.novel.permissions.tag_permission import TagPermission
from app.novel.tests.factories.tag_factory import TagFactory

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/novel/tags"


class TestTagDetailApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/novel/tags/{id}."""

    def test_detail_success_full_data(self, user: Any, login: Any) -> None:
        """Lấy chi tiết thẻ thành công."""
        tag = TagFactory(name="Vô Địch Lưu")
        grant(user, TagPermission.READ)
        api = login(user)

        res = api.get(f"{BASE_URL}/{tag.pk}")
        data = self.assert_success(res, 200)

        assert data["id"] == str(tag.pk)
        assert data["name"] == "Vô Địch Lưu"

    def test_detail_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        tag = TagFactory()
        res = client.get(f"{BASE_URL}/{tag.pk}")
        self.assert_unauthorized(res)

    def test_detail_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền novel.tag.read bị 403."""
        tag = TagFactory()
        api = login(user)
        res = api.get(f"{BASE_URL}/{tag.pk}")
        self.assert_forbidden(res)
