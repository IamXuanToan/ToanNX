"""Kiểm thử endpoint cập nhật thẻ: PATCH /api/v1/novel/tags/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.novel.permissions.tag_permission import TagPermission
from app.novel.tests.factories.tag_factory import TagFactory
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/novel/tags"


class TestTagUpdateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint PATCH /api/v1/novel/tags/{id}."""

    def test_update_success_full_data(self, user: Any, login: Any) -> None:
        """Cập nhật thẻ thành công."""
        tag = TagFactory(name="Cũ", slug="slug-cu-tag")
        grant(user, TagPermission.UPDATE)
        api = login(user)

        payload = {"name": "Tên Mới", "slug": "slug-moi-tag"}
        res = api.patch(f"{BASE_URL}/{tag.pk}", payload, format="json")
        data = self.assert_success(res, 200)

        assert data["name"] == "Tên Mới"
        assert data["slug"] == "slug-moi-tag"

    def test_update_validation_duplicate_slug(self, user: Any, login: Any) -> None:
        """Báo lỗi khi cập nhật trùng slug của thẻ khác."""
        TagFactory(slug="slug-ton-tai-tag")
        tag = TagFactory(slug="slug-cua-toi-tag")

        grant(user, TagPermission.UPDATE)
        api = login(user)

        res = api.patch(f"{BASE_URL}/{tag.pk}", {"slug": "slug-ton-tai-tag"}, format="json")
        self.assert_error(res, 409, "CONFLICT")

    def test_update_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        tag = TagFactory()
        res = client.patch(f"{BASE_URL}/{tag.pk}", {"name": "Test"}, format="json")
        self.assert_unauthorized(res)

    def test_update_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền novel.tag.update bị 403."""
        tag = TagFactory()
        api = login(user)
        res = api.patch(f"{BASE_URL}/{tag.pk}", {"name": "Test"}, format="json")
        self.assert_forbidden(res)
