"""Kiểm thử endpoint xóa thẻ: DELETE /api/v1/novel/tags/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.novel.models.tag import Tag
from app.novel.permissions.tag_permission import TagPermission
from app.novel.tests.factories.tag_factory import TagFactory
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/novel/tags"


class TestTagDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint DELETE /api/v1/novel/tags/{id}."""

    def test_delete_success_soft_delete(self, user: Any, login: Any) -> None:
        """Xóa mềm thẻ thành công (204 No Content)."""
        tag = TagFactory()
        grant(user, TagPermission.DELETE)
        api = login(user)

        res = api.delete(f"{BASE_URL}/{tag.pk}")
        assert res.status_code == 204

        tag.refresh_from_db()
        assert tag.deleted_at is not None
        assert Tag.objects.alive().filter(pk=tag.pk).exists() is False

    def test_delete_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        tag = TagFactory()
        res = client.delete(f"{BASE_URL}/{tag.pk}")
        self.assert_unauthorized(res)

    def test_delete_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền novel.tag.delete bị 403."""
        tag = TagFactory()
        api = login(user)
        res = api.delete(f"{BASE_URL}/{tag.pk}")
        self.assert_forbidden(res)
