"""Kiểm thử endpoint tạo thẻ: POST /api/v1/novel/tags."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.novel.permissions.tag_permission import TagPermission
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
URL = "/api/v1/novel/tags"


class TestTagCreateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/novel/tags."""

    def test_create_success_full_data(self, user: Any, login: Any) -> None:
        """Tạo thẻ thành công với đầy đủ các trường."""
        grant(user, TagPermission.CREATE)
        api = login(user)

        payload = {"name": "Trọng Sinh", "slug": "trong-sinh"}
        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 201)

        assert data["name"] == "Trọng Sinh"
        assert data["slug"] == "trong-sinh"

    def test_create_validation_duplicate_slug(self, user: Any, login: Any) -> None:
        """Báo lỗi khi trùng slug thẻ."""
        grant(user, TagPermission.CREATE)
        api = login(user)

        api.post(URL, {"name": "Thẻ 1", "slug": "trung-slug-tag"}, format="json")
        res = api.post(URL, {"name": "Thẻ 2", "slug": "trung-slug-tag"}, format="json")
        self.assert_error(res, 409, "CONFLICT")

    def test_create_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(URL, {"name": "Khách", "slug": "khach"}, format="json")
        self.assert_unauthorized(res)

    def test_create_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền novel.tag.create bị 403."""
        api = login(user)
        res = api.post(URL, {"name": "Thiếu", "slug": "thieu"}, format="json")
        self.assert_forbidden(res)
